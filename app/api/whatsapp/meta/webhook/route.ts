import { NextResponse } from "next/server";

import { handleInboundMessage } from "@/lib/agent/handleInboundMessage";
import { handleOutboundResponse } from "@/lib/agent/handleOutboundResponse";
import { getWhatsAppIntegrationByPhoneNumberId } from "@/lib/whatsapp/getWhatsAppIntegrationByPhoneNumberId";
import { sendMetaWhatsAppMessage } from "@/lib/whatsapp/sendMetaWhatsAppMessage";
import {
  markOutboundMessageFailed,
  markOutboundMessageSent,
} from "@/lib/whatsapp/updateOutboundMessageDelivery";

const VERIFY_MODE = "subscribe";

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;

        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };

        contacts?: Array<{
          profile?: {
            name?: string;
          };
          wa_id?: string;
        }>;

        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;

          text?: {
            body?: string;
          };
        }>;

        statuses?: Array<unknown>;
      };
    }>;
  }>;
};

export async function GET(req: Request) {
  const verifyToken =
    process.env.META_WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error(
      "META_WHATSAPP_VERIFY_TOKEN is not configured",
    );

    return NextResponse.json(
      {
        error:
          "WhatsApp webhook verification is not configured",
      },
      {
        status: 500,
      },
    );
  }

  const url = new URL(req.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get(
    "hub.verify_token",
  );
  const challenge = url.searchParams.get(
    "hub.challenge",
  );

  if (
    mode === VERIFY_MODE &&
    token === verifyToken &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json(
    {
      error: "Webhook verification failed",
    },
    {
      status: 403,
    },
  );
}

export async function POST(req: Request) {
  try {
    const payload =
      (await req.json()) as MetaWebhookPayload;

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") {
          continue;
        }

        const value = change.value;

        if (!value) {
          continue;
        }

        const phoneNumberId =
          value.metadata?.phone_number_id?.trim();

        const messages = value.messages ?? [];

        if (messages.length === 0) {
          continue;
        }

        if (!phoneNumberId) {
          console.error(
            "Meta webhook message received without phone_number_id",
          );

          continue;
        }

        const integration =
          await getWhatsAppIntegrationByPhoneNumberId(
            phoneNumberId,
          );

        if (!integration) {
          console.error(
            `No active WhatsApp integration found for phone_number_id ${phoneNumberId}`,
          );

          continue;
        }

        for (const message of messages) {
          if (message.type !== "text") {
            continue;
          }

          const from = message.from?.trim();
          const text = message.text?.body?.trim();

          if (!from || !text) {
            continue;
          }

          const contact = value.contacts?.find(
            (item) => item.wa_id === from,
          );

          const displayName =
            contact?.profile?.name?.trim() || null;

          const inboundResult =
            await handleInboundMessage({
              clinicId: integration.clinicId,
              phoneNumber: from,
              displayName,
              text,
              provider: "META",
              providerMessageId:
                message.id?.trim() || null,
              rawPayload: {
                entryId: entry.id ?? null,
                phoneNumberId,
                message,
                contact: contact ?? null,
              },
            });

          if (inboundResult.duplicate) {
            continue;
          }

          /*
           * Primero persistimos la respuesta del agente
           * como OUTBOUND / PENDING.
           */
          const outboundResult =
            await handleOutboundResponse({
              clinicId: integration.clinicId,
              conversationId:
                inboundResult.conversation.id,
              response:
                inboundResult.agentResult.response,
              provider: "META",
            });

          if (
            outboundResult.skipped ||
            !outboundResult.message
          ) {
            continue;
          }

          /*
           * Enviamos a Meta el mismo texto que acabamos
           * de persistir.
           */
          try {
            const metaResult =
              await sendMetaWhatsAppMessage({
                phoneNumberId:
                  integration.phoneNumberId,
                to: from,
                text:
                  outboundResult.message.text ??
                  inboundResult.agentResult.response
                    ?.text ??
                  "",
              });

            /*
             * Meta aceptó el mensaje.
             * Actualizamos EL MISMO registro OUTBOUND.
             */
            await markOutboundMessageSent({
              clinicId: integration.clinicId,
              messageId: outboundResult.message.id,
              providerMessageId:
                metaResult.providerMessageId,
              rawPayload: metaResult.rawResponse,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Unknown Meta WhatsApp error";

            /*
             * Conservamos el mensaje en BD, pero marcado
             * como FAILED para poder diagnosticarlo o
             * reintentarlo posteriormente.
             */
            await markOutboundMessageFailed({
              clinicId: integration.clinicId,
              messageId: outboundResult.message.id,
              errorMessage,
            });

            console.error(
              "Error sending WhatsApp outbound message:",
              error,
            );
          }
        }
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Error processing Meta WhatsApp webhook:",
      error,
    );

    return NextResponse.json(
      {
        received: false,
        error: "Webhook processing failed",
      },
      {
        status: 500,
      },
    );
  }
}