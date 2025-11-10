import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseServer } from '@/lib/supabaseServer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function getBaseUrl() {
  return 'https://todaysworld.vercel.app'
}


function assertIntCents(n: unknown): number {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) throw new Error('Invalid dynamic price')
  return Math.round(v)
}

export async function POST() {
  try {
    const supabase = await supabaseServer()

    // 1) fetch dynamic price
    let price_cents: number | null = null
    let holders: number | null = null

    const { data: seatState } = await supabase
      .from('seat_state')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (seatState?.current_price_cents != null) {
      price_cents = Number(seatState.current_price_cents)
      holders = seatState.holders ?? null
    } else {
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })

      const base = 500, step = 50, cap = 5000
      const h = count ?? 0
      holders = h
      price_cents = Math.min(base + h * step, cap)
    }

    const unit_amount = assertIntCents(price_cents)

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
      success_url: `${getBaseUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/pricing`,
      metadata: {
        locked_price_cents: String(unit_amount),
        holder_count_at_checkout: holders != null ? String(holders) : '',
      },
    })

    console.log('SESSION URL:', session.url)

    if (!session.url) throw new Error('Invalid Stripe session URL')
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Checkout failed' },
      { status: 500 }
    )
  }
}


