'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../lib/supabaseBrowser';
import HlsPlayer from './components/HlsPlayer';

const fmtUSD = (cents?: number | null) =>
  cents == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(cents / 100);

type SeatState = {
  id?: number;
  holder_name?: string | null;
  current_price_cents?: number | null;
  hls_url?: string | null;
  expires_at?: string | null;
};

export default function Page() {
  const [seat, setSeat] = useState<SeatState | null>(null);
  const [countdown, setCountdown] = useState<string>('—');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fallbackSrc = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const videoSrc = useMemo(() => seat?.hls_url || fallbackSrc, [seat?.hls_url]);

  // realtime seat_state
  useEffect(() => {
    const sb = supabaseBrowser();

    sb
      .from('seat_state')
      .select('*')
      .then(({ data }: { data: any[] | null }) => {
        if (data?.length) setSeat(data[0] as SeatState);
      });

    const ch = sb
      .channel('seat_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_state' }, (p: { new: SeatState }) =>
        setSeat(p.new),
      )
      .subscribe();

    return () => {
      void sb.removeChannel(ch);
    };
  }, []);

  // countdown
  useEffect(() => {
    if (!seat?.expires_at) return setCountdown('—');
    const tick = () => {
      const t = Math.max(0, (new Date(seat.expires_at!).getTime() - Date.now()) / 1000);
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [seat?.expires_at]);

  async function buySeat() {
    try {
      setLoadingAction('seat');
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seat_buy' }),
      });
      const t = await r.text();
      const j = JSON.parse(t);
      if (j.error) alert(j.error);
      else if (j.url) window.location.href = j.url;
    } catch {
      alert('Checkout failed');
    } finally {
      setLoadingAction(null);
    }
  }

  async function tip(amount_cents = 500, message = '') {
    try {
      setLoadingAction(`tip-${amount_cents}`);
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tip', amount_cents, message }),
      });
      const t = await r.text();
      const j = JSON.parse(t);
      if (j.error) alert(j.error);
      else if (j.url) window.location.href = j.url;
    } catch {
      alert('Tip failed');
    } finally {
      setLoadingAction(null);
    }
  }

  const holderLabel = seat?.holder_name ?? '—';
  const priceLabel = fmtUSD(seat?.current_price_cents ?? 500);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Purple background + rounded triangle texture */}
<div className="absolute inset-0 -z-10 overflow-hidden">
  {/* solid purple */}
  <div className="absolute inset-0 bg-[#9B82FF]" />
  {/* triangles (rounded) texture */}
  <div className="absolute inset-0 triangles-rounded pointer-events-none" />
</div>


      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:items-start lg:py-16">
        {/* LEFT: video + controls */}
        <section className="flex-1 space-y-6">
          {/* small label */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[0.7rem] uppercase tracking-[0.2em] text-fuchsia-100/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(190,242,100,0.9)]" />
            Today&apos;s World • Live
          </div>

          {/* floating video */}
          <div className="relative w-full max-w-3xl">
            <div className="absolute inset-0 -z-10 translate-y-6 blur-3xl opacity-70 bg-[conic-gradient(at_top,_#ff6ad5,#ffb463,#ffe66d,#7cf6a8,#5be3ff,#c4a1ff,#ff6ad5)]" />
            <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/60 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
              <HlsPlayer src={videoSrc} poster="/poster.jpg" />
            </div>
          </div>

          {/* stats row */}
          <div className="flex flex-wrap gap-3 text-xs font-medium">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 backdrop-blur">
              <span className="uppercase tracking-[0.18em] text-neutral-300">Holder</span>
              <span className="text-sm font-semibold text-white">{holderLabel}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 backdrop-blur">
              <span className="uppercase tracking-[0.18em] text-neutral-300">Time Left</span>
              <span className="font-mono text-sm text-lime-300">{countdown}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 backdrop-blur">
              <span className="uppercase tracking-[0.18em] text-neutral-300">Seat Price</span>
              <span className="text-sm font-semibold text-cyan-200">{priceLabel}</span>
            </div>
          </div>

          {/* short tagline */}
          <p className="max-w-xl text-sm text-neutral-200/85">
            One world. One mic. Whoever buys the seat owns the next ten minutes of the message.
          </p>

          {/* buttons row */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={buySeat}
              disabled={!!loadingAction}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgb(228,115,59)] px-7 py-3 text-sm font-semibold text-slate-900 shadow-[0_18px_50px_rgba(0,0,0,0.75)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAction === 'seat' ? 'Starting checkout…' : 'Take the Mic'}
            </button>
            <button
              onClick={() => tip(500)}
              disabled={!!loadingAction}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-[rgb(244,194,82)] px-5 py-2.5 text-xs font-medium text-black shadow-[0_12px_35px_rgba(0,0,0,0.7)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAction === 'tip-500' ? 'Sending tip…' : 'Tip $5'}
            </button>
            <button
              onClick={() => tip(1000)}
              disabled={!!loadingAction}
              className="inline-flex items-center justify-center rounded-full border border-amber-300/70 bg-[rgb(152,210,93)] px-5 py-2.5 text-xs font-medium text-black shadow-[0_12px_35px_rgba(0,0,0,0.7)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAction === 'tip-1000' ? 'Sending tip…' : 'Tip $10'}
            </button>
          </div>
        </section>

        {/* RIGHT: chat + wall */}
        <section className="flex w-full max-w-md flex-1 flex-col gap-5">
          <div className="rounded-3xl border border-white/12 bg-black/60 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-200">
              Live Chat
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              React, hype the holder, send love to the mic.
            </p>
            <div className="mt-3">
              <Chat />
            </div>
          </div>

          <div className="rounded-3xl border border-white/12 bg-black/60 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-200">
              Wall of Holders
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              Every seat taken gets written here with your name and timestamp.
            </p>
            <div className="mt-3">
              <Wall />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------- Chat ---------- */
function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [username, setUsername] = useState<string>('');
  const [text, setText] = useState<string>('');

  useEffect(() => {
    const poll = async () => {
      const { messages } = await fetch('/api/chat-feed')
        .then((r) => r.json())
        .catch(() => ({ messages: [] }));
      setMessages(messages ?? []);
    };
    poll();
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, []);

  const send = async () => {
    const name = username.trim().slice(0, 40) || 'anon';
    const msg = text.trim().slice(0, 200);
    if (!msg) return;
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, text: msg }),
    });
    setText('');
  };

  return (
    <div className="flex h-[360px] flex-col rounded-2xl border border-white/10 bg-black/60 p-3 text-sm">
      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {messages.map((m: any) => {
          const isTip = !!m.is_tip;
          const color = m.color ?? (isTip ? '#fbbf24' : 'inherit');
          return (
            <div key={m.id} className={`text-xs sm:text-sm ${isTip ? 'font-bold' : ''}`} style={{ color }}>
              {isTip && <span className="mr-1">💸</span>}
              <span className="opacity-60">{m.username}:</span> {m.text}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Name (optional)"
          className="flex-1 rounded-xl border border-white/15 bg-black/60 px-2 py-1 text-xs outline-none placeholder:text-neutral-500"
        />
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          className="flex-1 rounded-xl border border-white/15 bg-black/60 px-2 py-1 text-xs outline-none placeholder:text-neutral-500"
        />
        <button
          onClick={send}
          className="rounded-xl bg-[rgb(158,122,246)] px-3 py-1 text-xs font-semibold text-slate-900"
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ---------- Wall ---------- */
function Wall() {
  const [entries, setEntries] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const r = await fetch('/api/wall');
      const j = await r.json();
      setEntries(j.entries ?? []);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid grid-cols-1 gap-2 text-sm">
      {entries.map((w: any) => (
        <div
          key={w.id}
          className="rounded-xl border border-white/10 bg-white/10 p-3 text-xs text-neutral-100"
        >
          <div className="text-sm font-medium">{w.display_name ?? 'Holder'}</div>
          <div className="mt-1 text-[0.7rem] opacity-70">
            {new Date(w.started_at).toLocaleString()}
          </div>
        </div>
      ))}
      {entries.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/20 p-4 text-center text-xs text-neutral-400">
          No holders yet — be the first. 🎤
        </div>
      )}
    </div>
  );
}

