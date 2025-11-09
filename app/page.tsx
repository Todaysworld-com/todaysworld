'use client'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import HlsPlayer from '@/components/HlsPlayer'

export default function Page() {
  const [seat, setSeat] = useState<any>(null)
  const testSrc = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

  useEffect(() => {
    const sb = supabaseBrowser()
    sb.from('seat_state').select('*').then(({ data }) => data?.length && setSeat(data[0]))
    const ch = sb.channel('seat_state').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'seat_state' },
      p => setSeat(p.new)
    ).subscribe()
    return () => { void sb.removeChannel(ch) }
  }, [])

  async function buySeat() {
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'seat_buy' }),
    })
    const t = await r.text()
    try {
      const j = JSON.parse(t)
      if (j.error) return alert(j.error)
      if (j.url) return (window.location.href = j.url)
    } catch {
      alert('Checkout failed: ' + t)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">The World’s Daily Message</h1>
      <p className="text-neutral-300">
        One message. Updated daily. The clean, ad-free experience.
      </p>

      <HlsPlayer src={testSrc} poster="/poster.jpg" />

      <div className="pt-8 space-y-3">
        <h2 className="text-2xl font-semibold">🎙️ Current Seat Holder</h2>
        <p>{seat?.holder_name ?? 'No one yet'}</p>
        <p>Price: ${((seat?.current_price_cents ?? 500) / 100).toFixed(2)}</p>
        <button
          onClick={buySeat}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Buy Seat
        </button>
      </div>
    </div>
  )
}


