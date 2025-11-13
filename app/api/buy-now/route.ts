export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { okJson, noContent } from "../_cors";

export async function POST() {
  const { data: state } = await supabaseAdmin
    .from("seat_state")
    .select("*")
    .eq("id", 1)
    .single();

  const price = state?.current_price_cents ?? 500;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "Today’s World Mic (10 min)" },
        unit_amount: price,
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?canceled=1`,
    metadata: { type: "seat_buy" },
  });

  return okJson({ url: session.url });
}

export async function OPTIONS() { return noContent(); }

