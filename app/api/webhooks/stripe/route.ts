import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const buf = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // TODO: mark subscription active (we’ll do this in Phase 2)
      break;
    case 'customer.subscription.deleted':
      // TODO: mark inactive
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: { bodyParser: false },
};

