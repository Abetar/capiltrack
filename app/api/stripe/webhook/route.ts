// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcrypt";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();

  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 🔥 EVENTO CLAVE
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const metadata = session.metadata;

    if (!metadata) {
      console.error("No metadata found");
      return NextResponse.json({ error: "No metadata" }, { status: 400 });
    }

    const { name, email, password, clinicName } = metadata;

    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    try {
      // 🔒 1. Buscar por Stripe (fuente de verdad)
      let existingUser = await prisma.user.findFirst({
        where: {
          stripeCustomerId: customerId,
        },
      });

      // 🔒 2. Fallback por email
      if (!existingUser && email) {
        existingUser = await prisma.user.findUnique({
          where: { email },
        });
      }

      if (existingUser) {
        console.log("Usuario ya existe:", existingUser.email);

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            stripeCustomerId: customerId,
            stripeSubId: subscriptionId,
            subscriptionStatus: "active",
            isBlocked: false,
          },
        });

        return NextResponse.json({ ok: true });
      }

      // 🔐 Crear nuevo usuario (OWNER porque paga)
      const hashedPassword = await bcrypt.hash(password, 10);

      const clinic = await prisma.clinic.create({
        data: {
          name: clinicName,
        },
      });

      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          clinicId: clinic.id,

          // 🔥 CAMBIO REAL
          role: "DOCTOR",

          stripeCustomerId: customerId,
          stripeSubId: subscriptionId,
          subscriptionStatus: "active",

          isBlocked: false,
        },
      });

      console.log("✅ Usuario OWNER creado después de pago:", email);
    } catch (error) {
      console.error("Error creando usuario:", error);
    }
  }

  return NextResponse.json({ received: true });
}
