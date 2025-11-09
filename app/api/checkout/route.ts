// app/api/checkout/route.ts
console.log("Using success_url:", "https://todaysworld.vercel.app/success?session_id={CHECKOUT_SESSION_ID}");

export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

// Absolute HTTPS URLs — do NOT use envs or relative paths here
const SUCCESS = "https://todaysworld.vercel.app/success?session_id={CHECKOUT_SESSION_ID}";
const CANCEL  = "https://todaysworld.vercel.app/pricing";

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 500,
            product_data: { name: "Mic Slot (10 minutes)" },
          },
          quantity: 1,
        },
      ],
      success_url: SUCCESS,
      cancel_url: CANCEL,
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("Stripe error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
