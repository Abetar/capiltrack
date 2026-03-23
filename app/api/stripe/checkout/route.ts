import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { name, email, password, clinicName } = body

    // 🔒 validación básica
    if (!name || !email || !password || !clinicName) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: "CapilTrack",
              description: "Software para clínicas capilares",
            },
            unit_amount: 149900,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/login?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?payment=cancelled`,

      // 🔥 AQUÍ ESTÁ LA CLAVE
      metadata: {
        name,
        email,
        password,
        clinicName,
      },
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Stripe error" }, { status: 500 })
  }
}