import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs' // Stripe needs Node runtime

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!
  const raw = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as any // Stripe.Checkout.Session
    const cents = s.amount_total ?? 0
    const userId = s.client_reference_id ?? null
    const type = s.metadata?.type ?? 'seat_buy'
    const message = s.metadata?.message ?? null

    const supabase = supabaseServer()

    // 1) record transaction
    await supabase.from('transactions').insert({
      type,
      user_id: userId,
      holder_id: userId,
      amount_cents: cents,
      stripe_payment_id: s.id,
      message,
    })

    // 2) update seat if purchase
    if (type === 'seat_buy' || type === 'buy_now') {
      const now = new Date()
      const expires = new Date(now.getTime() + 10 * 60 * 1000).toISOString()
      await supabase
        .from('seat_state')
        .update({
          current_holder: userId,
          holder_name: s.customer_details?.name ?? 'Anonymous',
          started_at: now.toISOString(),
          expires_at: expires,
        })
        .eq('id', 1)
    }
  }

  return NextResponse.json({ received: true })
}




