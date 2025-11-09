// app/api/subscribe/route.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

// Hardcode your public origin to avoid bad envs breaking Stripe URLs
const ORIGIN = "https://todaysworld.vercel.app";

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID!, quantity: 1 }],
      success_url: `${ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ORIGIN}/pricing`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (e: any) {
    console.error("Subscribe error:", e?.message || e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), { status: 500 });
  }
}
// force redeploy



