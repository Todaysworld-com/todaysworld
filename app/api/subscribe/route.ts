// app/api/subscribe/route.ts
export const dynamic = 'force-dynamic';


import { noContent } from "../_cors";

export const runtime = "nodejs";

import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabaseServer";

const ORIGIN = "https://todaysworld.vercel.app";

export async function POST() {
  try {
    // get latest dynamic price
   const sb = await supabaseServer();

    const { data, error } = await sb.from("seat_state").select("current_price_cents").limit(1).single();
    if (error) throw new Error(error.message);

    const price = data?.current_price_cents ?? 500;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: price,
            product_data: { name: "Subscription (Recurring Mic Access)" },
          },
          quantity: 1,
        },
      ],
      success_url: `${ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ORIGIN}/pricing`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (e: any) {
    console.error("Subscribe error:", e?.message || e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), { status: 500 });
  }
}
export async function OPTIONS() { return noContent(); }
