'use client'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export default function SeatDisplay() {
  const [seat, setSeat] = useState<any>(null)

  useEffect(() => {
    const supabase = supabaseBrowser()
    supabase.from('seat_state').select('*').then(({ data }) => data?.length && setSeat(data[0]))
    const ch = supabase.channel('seat_state').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'seat_state' },
      p => setSeat(p.new)
    ).subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [])

  async function buySeat() {
  const r = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'seat_buy' }),
  })
  const text = await r.text()
  try {
    const j = JSON.parse(text)
    if (j.error) return alert(j.error)
    if (j.url) return (window.location.href = j.url)
    alert('Unexpected response: ' + text)
  } catch {
    alert('Checkout failed: ' + text)
  }
}


  return (
    <div className="p-6 space-y-3">
      <h2>🎙️ Current Seat Holder</h2>
      <p>{seat?.holder_name ?? 'No one yet'}</p>
      <p>Price: ${((seat?.current_price_cents ?? 500)/100).toFixed(2)}</p>
      <button onClick={buySeat} className="bg-blue-600 text-white px-4 py-2 rounded">Buy Seat</button>
    </div>
  )
}


