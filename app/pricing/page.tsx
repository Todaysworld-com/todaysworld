'use client'
import { useState } from 'react'

export default function PricingPage() {
  const [loading, setLoading] = useState(false)

  const startSubscription = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/subscribe', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      window.location.href = data.url
    } catch (err: any) {
      alert(err.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Support the Daily Message</h1>
      <p className="text-neutral-300">
        Unlock the ad-free experience & archives.
      </p>
      <button
        onClick={startSubscription}
        disabled={loading}
        className="rounded-xl bg-white px-5 py-3 font-semibold text-black disabled:opacity-60"
      >
        {loading ? 'Redirecting…' : 'Subscribe'}
      </button>
    </div>
  )
}

