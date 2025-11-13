export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { stripe } from "@/lib/stripe";
import { okJson, noContent } from "../_cors";

export async function POST(req: Request) {
  const { amount_cents, message } = await req.json();
  const safeMsg = (message || "").toString().slice(0, 140);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "Tip (Today’s World)" },
        unit_amount: amount_cents,
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?tipped=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?tip_canceled=1`,
    metadata: { type: "tip", message: safeMsg },
  });

  return okJson({ url: session.url });
}

export async function OPTIONS() { return noContent(); }
