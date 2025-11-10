// app/api/tip/route.ts
import { noContent } from "../_cors";

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
            unit_amount: 200, // $2 tip
            product_data: { name: "Tip for the Mic Holder" },
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
export async function OPTIONS() { return noContent(); }
