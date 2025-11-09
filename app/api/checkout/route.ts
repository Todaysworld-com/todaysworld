function getBaseUrl() {
  // Preferred explicit URL you set in env (works locally + prod)
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Vercel fallback if you didn’t set NEXT_PUBLIC_SITE_URL in Preview/Prod
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  // Local fallback for dev servers
  return 'http://localhost:3000';
}

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: process.env.STRIPE_ONE_TIME_PRICE_ID!, quantity: 1 }],
      success_url: `${getBaseUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/pricing`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (e: any) {
    console.error('Checkout error:', e);
    return new Response(JSON.stringify({ error: e?.message ?? 'Unknown error' }), { status: 500 });
  }
}


