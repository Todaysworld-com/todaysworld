'use client';
import { useState } from 'react';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/checkout/create', { method: 'POST' });
      const { url } = await res.json();
      window.location.href = url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Support the Daily Message</h1>
      <p className="text-neutral-300">
        Unlock the ad-free experience & archives.
      </p>
      <button
        onClick={startCheckout}
        disabled={loading}
        className="rounded-xl bg-white px-5 py-3 font-semibold text-black disabled:opacity-60"
      >
        {loading ? 'Redirecting…' : 'Subscribe'}
      </button>
    </div>
  );
}
