import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("⚠️  Webhook signature error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as any;
    const cents = s.amount_total ?? 0;
    const userId = s.client_reference_id ?? null;
    const type = s.metadata?.type ?? "seat_buy";
    const message = s.metadata?.message ?? null;
const supabase = await supabaseServer();

    // 1) record transaction
    const tx = await supabase.from("transactions").insert({
      type,
      user_id: userId,
      holder_id: userId,
      amount_cents: cents,
      stripe_payment_id: s.id,
      message,
    });
    if (tx.error) console.error("❌ transactions insert error:", tx.error);

    // 2) update seat
    if (type === "seat_buy" || type === "buy_now") {
      const now = new Date();
      const expires = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
      const up = await supabase
        .from("seat_state")
        .update({
          current_holder: userId,
          holder_name: s.customer_details?.name ?? "Anonymous",
          started_at: now.toISOString(),
          expires_at: expires,
        })
        .eq("id", 1);
      if (up.error) console.error("❌ seat_state update error:", up.error);
    }
  }

  return NextResponse.json({ received: true });
}
