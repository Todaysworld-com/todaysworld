// app/api/buy-now/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

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
            unit_amount: 2500, // $25 buy-now slot
            product_data: { name: "Buy-Now Mic Slot (50 minutes)" },
          },
          quantity: 1,
        },
      ],
      success_url: SUCCESS,
      cancel_url: CANCEL,
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
