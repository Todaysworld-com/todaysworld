import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseServer } from '@/lib/supabaseServer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
// no apiVersion to avoid union-type build errors

function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL
  return env && env.startsWith('http') ? env : 'https://todaysworld.vercel.app'
}

function assertIntCents(n: unknown): number {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) throw new Error('Invalid dynamic price')
  return Math.round(v) // Stripe needs integer cents
}

export async function POST() {
  try {
    // 1) Get the current price (same logic as /api/state so the checkout “locks” it)
   const supabase = await supabaseServer()

    let price_cents: number | null = null
    let holders: number | null = null

    // Try seat_state first
    const { data: seatState } = await supabase
      .from('seat_state')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (seatState?.current_price_cents != null) {
      price_cents = Number(seatState.current_price_cents)
      holders = seatState.holders ?? null
    } else {
      // Fallback: compute from holder count if present
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })

      const base = 500, step = 50, cap = 5000
      const h = (count ?? 0)
      holders = h
      price_cents = Math.min(base + h * step, cap)
    }

    const unit_amount = assertIntCents(price_cents)

    // 2) Create Stripe session with price_data (dynamic)
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
            unit_amount, // <-- dynamic cents
          },
          quantity: 1,
        },
      ],
      success_url: `${getBaseUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/pricing`,
      metadata: {
        locked_price_cents: String(unit_amount),
        holder_count_at_checkout: holders != null ? String(holders) : '',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return new NextResponse(
      JSON.stringify({ error: err?.message ?? 'Checkout failed' }),
      { status: 500 }
    )
  }
}

