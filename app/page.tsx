'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../lib/supabaseBrowser';
import HlsPlayer from './components/HlsPlayer';

/* ---------- Helpers ---------- */
const fmtUSD = (cents?: number | null) =>
  cents == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
        cents / 100
      );

type SeatState = {
  id?: number;
  holder_name?: string | null;
  current_price_cents?: number | null;
  hls_url?: string | null;
  expires_at?: string | null;
};

/* ============================================================
   PAGE
============================================================ */
export default function Page() {
  const [seat, setSeat] = useState<SeatState | null>(null);
  const [countdown, setCountdown] = useState('—');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fallback = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const videoSrc = useMemo(() => seat?.hls_url || fallback, [seat?.hls_url]);

  /* ---------- REALTIME seat_state ---------- */
  useEffect(() => {
    const sb = supabaseBrowser();

    sb.from('seat_state')
      .select('*')
      .then(({ data }) => data?.[0] && setSeat(data[0]));

    const ch = sb
      .channel('seat_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_state' }, (p) =>
        setSeat(p.new)
      )
      .subscribe();

    return () => void sb.removeChannel(ch);
  }, []);

  /* ---------- Countdown ---------- */
  useEffect(() => {
    if (!seat?.expires_at) return setCountdown('—');
    const tick = () => {
      const t = Math.max(
        0,
        (new Date(seat.expires_at!).getTime() - Date.now()) / 1000
      );
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [seat?.expires_at]);

  /* ---------- Checkouts ---------- */
  async function buySeat() {
    try {
      setLoadingAction('seat');
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seat_buy' })
      });
      const t = await r.text();
      const j = JSON.parse(t);
      if (j.url) window.location.href = j.url;
      else if (j.error) alert(j.error);
    } catch {
      alert('Checkout failed');
    } finally {
      setLoadingAction(null);
    }
  }

  async function tip(amount_cents: number) {
    try {
      setLoadingAction('tip');
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tip', amount_cents })
      });
      const t = await r.text();
      const j = JSON.parse(t);
      if (j.url) window.location.href = j.url;
    } catch {
      alert('Tip failed');
    } finally {
      setLoadingAction(null);
    }
  }

  /* ============================================================
     UI
  ============================================================ */
  return (
    <main className="relative min-h-screen text-white overflow-hidden bg-black">

      {/* ---------- Poster Background ---------- */}
      <div className="absolute inset-0 -z-10">
        {/* FULL psychedelic rainbow bands */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-500 via-orange-400 via-yellow-300 via-green-300 via-cyan-300 via-purple-400 to-fuchsia-500 opacity-40" />
        {/* soft noise */}
        <div className="absolute inset-0 noise-overlay opacity-20" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-10">

        {/* ============================================================
            VIDEO FIRST — FLOATING W/ RAINBOW HALO
        ============================================================ */}
        <div className="relative mx-auto w-full max-w-4xl">
          <div className="absolute inset-0 -z-10 blur-3xl opacity-60 bg-gradient-to-r from-fuchsia-400 via-orange-300 to-yellow-300 rounded-3xl" />
          <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <HlsPlayer src={videoSrc} poster="/poster.jpg" />
          </div>
        </div>

        {/* ---------- Stats Row ---------- */}
        <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold">
          <div className="px-4 py-1 rounded-full bg-fuchsia-600/60 backdrop-blur-md">
            Holder: {seat?.holder_name ?? '—'}
          </div>
          <div className="px-4 py-1 rounded-full bg-emerald-600/60 backdrop-blur-md">
            Time Left: {countdown}
          </div>
          <div className="px-4 py-1 rounded-full bg-cyan-600/60 backdrop-blur-md">
            Price: {fmtUSD(seat?.current_price_cents)}
          </div>
        </div>

        {/* ---------- Tagline ---------- */}
        <p className="text-center text-base md:text-lg font-medium text-white/90">
          In this moment — the mic belongs to whoever takes it.
        </p>

        {/* ---------- Buttons ---------- */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={buySeat}
            disabled={!!loadingAction}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-400 via-orange-300 to-yellow-300 text-black font-bold shadow-xl hover:scale-[1.03] transition">
            {loadingAction === 'seat' ? 'Loading...' : 'Take the Mic'}
          </button>

          <button
            onClick={() => tip(500)}
            disabled={!!loadingAction}
            className="px-6 py-3 rounded-2xl bg-orange-400/80 backdrop-blur-md text-black font-semibold hover:scale-[1.03] transition">
            Tip $5
          </button>

          <button
            onClick={() => tip(1000)}
            disabled={!!loadingAction}
            className="px-6 py-3 rounded-2xl bg-yellow-300/80 backdrop-blur-md text-black font-semibold hover:scale-[1.03] transition">
            Tip $10
          </button>
        </div>

        {/* ============================================================
            CHAT + WALL
        ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Chat */}
          <div className="md:col-span-2 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-4">
            <h2 className="text-lg font-bold mb-2">Live Chat</h2>
            <Chat />
          </div>

          {/* Wall */}
          <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-4">
            <h2 className="text-lg font-bold mb-2">Wall of Holders</h2>
            <Wall />
          </div>

        </div>
      </div>
    </main>
  );
}

/* ============================================================
   CHAT
============================================================ */
function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    const poll = async () => {
      const { messages } = await fetch('/api/chat-feed')
        .then((r) => r.json())
        .catch(() => ({ messages: [] }));
      setMessages(messages || []);
    };
    poll();
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, []);

  async function send() {
    const name = username.trim() || 'anon';
    const msg = text.trim();
    if (!msg) return;
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, text: msg })
    });
    setText('');
  }

  return (
    <div className="flex flex-col h-[360px] text-sm">
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {messages.map((m: any) => (
          <div key={m.id}>
            <span className="opacity-60">{m.username}: </span>
            {m.text}
          </div>
        ))}
      </div>
      <input
        className="mt-2 rounded-xl px-2 py-1 bg-black/50 border border-white/20"
        placeholder="name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 rounded-xl px-2 py-1 bg-black/50 border border-white/20"
          placeholder="message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={send}
          className="rounded-xl px-4 bg-gradient-to-r from-fuchsia-400 to-orange-300 text-black font-semibold">
          Send
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   WALL
============================================================ */
function Wall() {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const r = await fetch('/api/wall');
      const j = await r.json();
      setEntries(j.entries || []);
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
          className="rounded-xl border border-white/10 bg-white/10 p-3">
          <div className="font-bold">{w.display_name}</div>
          <div className="opacity-70 text-xs">
            {new Date(w.started_at).toLocaleString()}
          </div>
        </div>
      ))}

      {entries.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/20 p-4 text-center text-neutral-300 text-xs">
          No holders yet — take the mic. 🎤
        </div>
      )}
    </div>
  );
}
