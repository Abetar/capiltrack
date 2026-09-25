type SendMetaWhatsAppMessageInput = {
  phoneNumberId: string;
  to: string;
  text: string;
};

type MetaWhatsAppResponse = {
  messaging_product?: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

const META_GRAPH_VERSION = "v26.0";

export async function sendMetaWhatsAppMessage({
  phoneNumberId,
  to,
  text,
}: SendMetaWhatsAppMessageInput) {
  const accessToken =
    process.env.META_WHATSAPP_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "META_WHATSAPP_ACCESS_TOKEN is not configured",
    );
  }

  if (!phoneNumberId.trim()) {
    throw new Error("phoneNumberId is required");
  }

  if (!to.trim()) {
    throw new Error("WhatsApp recipient is required");
  }

  if (!text.trim()) {
    throw new Error("WhatsApp message text is required");
  }

  const response = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: text.trim(),
        },
      }),
    },
  );

  const data =
    (await response.json()) as MetaWhatsAppResponse;

  if (!response.ok) {
    console.error(
      "Meta WhatsApp API error:",
      JSON.stringify(data),
    );

    throw new Error(
      data.error?.message ||
        `Meta WhatsApp API request failed with status ${response.status}`,
    );
  }

  const providerMessageId = data.messages?.[0]?.id;

  if (!providerMessageId) {
    throw new Error(
      "Meta WhatsApp API did not return a message ID",
    );
  }

  return {
    providerMessageId,
    rawResponse: data,
  };
}