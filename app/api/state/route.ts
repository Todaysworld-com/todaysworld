import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// Simple, auditable formula as a fallback if there is no seat_state row.
// Tweak as you like.
function computePriceCents(holders: number) {
  const base = 500;          // $5.00 starting price
  const step = 50;           // +$0.50 per holder
  const cap  = 5000;         // cap at $50.00
  return Math.min(base + holders * step, cap)
}

export async function GET() {
  try {
   const supabase = await supabaseServer()


    // Preferred: read from a single-row table you maintain (seat_state).
    const { data: seatState, error } = await supabase
      .from('seat_state')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (seatState?.current_price_cents != null) {
      return NextResponse.json({
        price_cents: seatState.current_price_cents,
        holders: seatState.holders ?? null,
        reset_at: seatState.reset_at ?? null,
        hls_url: seatState.hls_url ?? null,
        source: 'seat_state'
      })
    }

    // Fallback: derive from holder count if you track purchases in `transactions`
    const { data: txAgg, error: txErr } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })

    if (txErr) throw txErr

    const holders = txAgg?.length === 0 ? 0 : (txAgg as any).length ?? 0 // head:true returns no rows; rely on count if your Supabase policy allows
    const price_cents = computePriceCents(holders)

    return NextResponse.json({
      price_cents,
      holders,
      reset_at: null,
      hls_url: null,
      source: 'fallback_formula'
    })
  } catch (e: any) {
    // Last-resort safe default
    return NextResponse.json(
      { price_cents: 500, holders: null, source: 'error', error: e?.message ?? 'unknown' },
      { status: 200 }
    )
  }
}

