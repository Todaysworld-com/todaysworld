export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { noContent } from "../_cors";
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabaseServer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://todaysworld.vercel.app';
}

function assertIntCents(n: unknown, label = 'amount'): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) throw new Error(`Invalid ${label}`);
  return Math.round(v);
}

function clampTip(n: number) {
  // Keep tips sane (e.g., $1 – $10,000)
  const min = 100;      // $1
  const max = 1_000_000; // $10,000
  return Math.min(Math.max(n, min), max);
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const body = await req.json().catch(() => ({}));
    const type = String(body?.type || 'seat_buy');

    // Common success/cancel urls
    const success_url = `${getBaseUrl()}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url  = `${getBaseUrl()}/pricing`;

    if (type === 'tip') {
      // ---- Tip flow ----
      const raw = assertIntCents(body?.amount_cents, 'tip');
      const unit_amount = clampTip(raw);
      const message: string = (body?.message ? String(body.message) : '').slice(0, 200);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Tip',
                description: message || 'Support the Daily Message',
              },
              unit_amount,
            },
            quantity: 1,
          },
        ],
        success_url,
        cancel_url,
        metadata: {
          kind: 'tip',
          tip_cents: String(unit_amount),
          tip_message: message,
        },
      });

      if (!session.url) throw new Error('Invalid Stripe session URL');
      return NextResponse.json({ url: session.url });
    }

    // ---- Seat-buy flow (default) ----
    // 1) fetch dynamic price
    let price_cents: number | null = null;
    let holders: number | null = null;

    const { data: seatState } = await supabase
      .from('seat_state')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (seatState?.current_price_cents != null) {
      price_cents = Number(seatState.current_price_cents);
      holders = seatState.holders ?? null;
    } else {
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      const base = 500, step = 50, cap = 5000; // $5 base, +$0.50 per holder, capped at $50
      const h = count ?? 0;
      holders = h;
      price_cents = Math.min(base + h * step, cap);
    }

    const unit_amount = assertIntCents(price_cents, 'dynamic price');

    // 2) create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '10-minute mic seat',
              description: 'Dynamic seat price locked at checkout',
            },
            unit_amount,
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      metadata: {
        kind: 'seat_buy',
        locked_price_cents: String(unit_amount),
        holder_count_at_checkout: holders != null ? String(holders) : '',
      },
    });

    if (!session.url) throw new Error('Invalid Stripe session URL');
    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: err?.message, type: err?.type, code: err?.code },
      { status: 500 }
    );
  }
}

export async function OPTIONS() { return noContent(); }


