import { NextResponse } from "next/server";

import { handleInboundMessage } from "@/lib/agent/handleInboundMessage";
import { handleOutboundResponse } from "@/lib/agent/handleOutboundResponse";
import { getWhatsAppIntegrationByPhoneNumberId } from "@/lib/whatsapp/getWhatsAppIntegrationByPhoneNumberId";

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

    /*
     * Meta puede mandar varios entries/changes/messages
     * dentro de una sola petición.
     */
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        /*
         * Ignoramos cualquier evento que no pertenezca
         * al campo "messages".
         */
        if (change.field !== "messages") {
          continue;
        }

        const value = change.value;

        if (!value) {
          continue;
        }

        const phoneNumberId =
          value.metadata?.phone_number_id?.trim();

        /*
         * Algunos webhooks de Meta solamente contienen
         * statuses (sent, delivered, read, etc.).
         *
         * Todavía no procesamos esos eventos.
         */
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

        /*
         * Resolvemos qué clínica pertenece al número
         * de WhatsApp que recibió el mensaje.
         */
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
          /*
           * Primera versión:
           * solamente procesamos mensajes de texto.
           */
          if (message.type !== "text") {
            continue;
          }

          const from = message.from?.trim();
          const text = message.text?.body?.trim();

          if (!from || !text) {
            continue;
          }

          /*
           * Buscamos el nombre enviado por Meta.
           * Normalmente contacts[].wa_id coincide con
           * message.from.
           */
          const contact = value.contacts?.find(
            (item) => item.wa_id === from,
          );

          const displayName =
            contact?.profile?.name?.trim() || null;

          /*
           * Guarda el inbound, obtiene/crea la conversación
           * y ejecuta el agente persistente.
           */
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

          /*
           * Guardamos la respuesta producida por el agente.
           *
           * En este paso queda PENDING.
           * Todavía NO se envía a Meta.
           */
          await handleOutboundResponse({
            clinicId: integration.clinicId,
            conversationId:
              inboundResult.conversation.id,
            response: inboundResult.agentResult.response,
            provider: "META",
          });
        }
      }
    }

    /*
     * Meta necesita recibir 200 para considerar
     * correctamente reconocido el webhook.
     */
    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Error processing Meta WhatsApp webhook:",
      error,
    );

    /*
     * Por ahora devolvemos 500 para que un fallo real
     * sea visible durante nuestras pruebas.
     */
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