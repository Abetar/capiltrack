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
    console.error("❌ Missing stripe signature");
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 🔥 LOG GLOBAL
  console.log("🔥 EVENTO RECIBIDO:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("🔥 SESSION:", session.id);
    console.log("🔥 METADATA:", session.metadata);
    console.log("🔥 CUSTOMER:", session.customer);
    console.log("🔥 SUB RAW:", session.subscription);

    const metadata = session.metadata;

    if (!metadata) {
      console.error("❌ No metadata found");
      return NextResponse.json({ error: "No metadata" }, { status: 400 });
    }

    const { name, email, password, clinicName } = metadata;

    if (!name || !email || !password || !clinicName) {
      console.error("❌ Metadata incompleta:", metadata);
      return NextResponse.json(
        { error: "Incomplete metadata" },
        { status: 400 }
      );
    }

    const customerId = session.customer as string;

    // 🔥 FIX REAL — obtener subscripción correctamente
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["subscription"],
    });

    const subscription = fullSession.subscription as Stripe.Subscription;
    const subscriptionId = subscription?.id;

    if (!subscriptionId) {
      console.error("❌ subscriptionId no encontrado");
      return NextResponse.json(
        { error: "No subscriptionId" },
        { status: 400 }
      );
    }

    try {
      // 🔒 Buscar usuario existente
      let existingUser = await prisma.user.findFirst({
        where: {
          stripeCustomerId: customerId,
        },
      });

      if (!existingUser && email) {
        existingUser = await prisma.user.findUnique({
          where: { email },
        });
      }

      if (existingUser) {
        console.log("🔁 Updating existing user with new subscription:", subscriptionId);

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            stripeCustomerId: customerId,
            stripeSubId: subscriptionId, // 🔥 SIEMPRE sobrescribir
            subscriptionStatus: "active",
            isBlocked: false,
          },
        });

        console.log("✅ Usuario actualizado:", existingUser.email);

        return NextResponse.json({ ok: true });
      }

      // 🔐 Crear usuario nuevo
      console.log("🟡 Creando usuario nuevo...");

      const hashedPassword = await bcrypt.hash(password, 10);

      const clinic = await prisma.clinic.create({
        data: {
          name: clinicName,
        },
      });

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          clinicId: clinic.id,

          role: "DOCTOR",

          stripeCustomerId: customerId,
          stripeSubId: subscriptionId,
          subscriptionStatus: "active",

          isBlocked: false,
        },
      });

      console.log("✅ Usuario creado correctamente:", newUser.email);
    } catch (error) {
      console.error("❌ Error creando usuario:", error);
    }
  }

  return NextResponse.json({ received: true });
}