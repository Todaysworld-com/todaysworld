'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../lib/supabaseBrowser';
import HlsPlayer from './components/HlsPlayer';

/* ------------ Helpers ------------ */
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

  /* ----------------- Realtime seat_state ----------------- */
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

  /* ----------------- Countdown ----------------- */
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

  /* ----------------- Checkout ----------------- */
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
     UI STARTS HERE
  ============================================================ */
  return (
    <main className="relative min-h-screen text-white overflow-hidden">

      {/* ========================================================
           WAVY BONNAROO BACKGROUND
      ======================================================== */}
      <div className="absolute inset-0 -z-10 overflow-hidden">

        {/* Each layer = wavy rainbow band */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-pink-500 opacity-80 wave-1" />
        <div className="absolute top-20 left-0 right-0 h-40 bg-orange-400 opacity-80 wave-2" />
        <div className="absolute top-40 left-0 right-0 h-40 bg-yellow-300 opacity-80 wave-3" />
        <div className="absolute top-60 left-0 right-0 h-40 bg-green-400 opacity-80 wave-4" />
        <div className="absolute top-80 left-0 right-0 h-40 bg-cyan-400 opacity-80 wave-5" />
        <div className="absolute top-[26rem] left-0 right-0 h-40 bg-blue-500 opacity-80 wave-6" />
        <div className="absolute top-[34rem] left-0 right-0 h-40 bg-purple-500 opacity-80 wave-7" />
        <div className="absolute top-[42rem] left-0 right-0 h-40 bg-fuchsia-500 opacity-80 wave-8" />

        {/* Grain overlay */}
        <div className="absolute inset-0 noise-overlay opacity-20" />
      </div>

      {/* ------------------- Main Content ------------------- */}
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-12">

        {/* ========================================================
             FLOATING VIDEO WITH RAINBOW HALO
        ======================================================== */}
        <div className="relative mx-auto w-full max-w-3xl">
          <div className="absolute inset-0 -z-10 blur-3xl opacity-80 bg-gradient-to-r from-pink-400 via-orange-300 to-yellow-300 rounded-[2.5rem]" />
          <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-white/20">
            <HlsPlayer src={videoSrc} poster="/poster.jpg" />
          </div>
        </div>

        {/* ========================================================
            COLOR BADGES UNDER VIDEO
        ======================================================== */}
        <div className="flex flex-wrap justify-center gap-3 text-sm font-bold drop-shadow-xl">
          <div className="px-4 py-1 rounded-full bg-pink-600/80 backdrop-blur">
            Holder: {seat?.holder_name ?? '—'}
          </div>
          <div className="px-4 py-1 rounded-full bg-emerald-500/80 backdrop-blur">
            Time: {countdown}
          </div>
          <div className="px-4 py-1 rounded-full bg-cyan-500/80 backdrop-blur">
            Price: {fmtUSD(seat?.current_price_cents)}
          </div>
        </div>

        {/* ========================================================
            TAGLINE
        ======================================================== */}
        <p className="text-center text-lg font-semibold drop-shadow-lg">
          A global mic. One voice at a time. Your moment.
        </p>

        {/* ========================================================
            BUTTONS
        ======================================================== */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={buySeat}
            disabled={!!loadingAction}
            className="px-10 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-400 via-orange-300 to-yellow-300 text-black font-extrabold shadow-xl hover:scale-[1.04] transition">
            {loadingAction === 'seat' ? 'Loading…' : 'Take the Mic'}
          </button>

          <button
            onClick={() => tip(500)}
            disabled={!!loadingAction}
            className="px-6 py-3 rounded-2xl bg-orange-400 text-black font-bold shadow-lg hover:scale-[1.04] transition">
            Tip $5
          </button>

          <button
            onClick={() => tip(1000)}
            disabled={!!loadingAction}
            className="px-6 py-3 rounded-2xl bg-yellow-300 text-black font-bold shadow-lg hover:scale-[1.04] transition">
            Tip $10
          </button>
        </div>

        {/* ========================================================
            CHAT + WALL SECTION (kept same, restyled)
        ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Chat Box */}
          <div className="md:col-span-2 rounded-3xl border border-white/20 bg-black/40 backdrop-blur-xl p-5 shadow-xl">
            <h2 className="text-xl font-bold mb-3 drop-shadow">Live Chat</h2>
            <Chat />
          </div>

          {/* Wall */}
          <div className="rounded-3xl border border-white/20 bg-black/40 backdrop-blur-xl p-5 shadow-xl">
            <h2 className="text-xl font-bold mb-3 drop-shadow">Wall of Holders</h2>
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
        className="mt-2 rounded-xl px-2 py-1 bg-black/40 border border-white/20"
        placeholder="name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 rounded-xl px-2 py-1 bg-black/40 border border-white/20"
          placeholder="message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={send}
          className="rounded-xl px-4 bg-gradient-to-r from-fuchsia-400 to-orange-300 text-black font-bold">
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
          className="rounded-xl border border-white/20 bg-white/10 p-3">
          <div className="font-bold">{w.display_name}</div>
          <div className="opacity-70 text-xs">
            {new Date(w.started_at).toLocaleString()}
          </div>
        </div>
      ))}

      {entries.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/30 p-4 text-center text-xs opacity-80">
          No holders yet — take the mic 🎤
        </div>
      )}
    </div>
  );
}
