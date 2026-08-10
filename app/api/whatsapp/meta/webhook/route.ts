import { NextResponse } from "next/server";

const VERIFY_MODE = "subscribe";

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

/*
 * POST todavía NO procesa mensajes.
 *
 * Por ahora simplemente reconocemos la petición para
 * tener preparada la ruta sin conectar aún el payload
 * de Meta con el agente.
 */
export async function POST() {
  return NextResponse.json({
    received: true,
  });
}