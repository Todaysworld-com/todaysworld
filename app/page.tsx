'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../lib/supabaseBrowser';
import HlsPlayer from './components/HlsPlayer';

const fmtUSD = (cents?: number | null) =>
  cents == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

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
  const [loadingAction, setLoadingAction] = useState<'seat' | 'tip5' | 'tip10' | null>(null);

  const fallbackSrc = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const videoSrc = useMemo(() => seat?.hls_url || fallbackSrc, [seat?.hls_url]);

  // --- Supabase realtime seat_state (same as before) ---
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

  // --- Countdown (same logic) ---
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

  // --- Stripe checkout (same endpoint + payload) ---
  async function buySeat() {
    try {
      setLoadingAction('seat');
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seat_buy' }),
      });
      const t = await r.text();
      try {
        const j = JSON.parse(t);
        if (j.error) alert(j.error);
        else if (j.url) window.location.href = j.url;
      } catch {
        alert('Checkout failed: ' + t);
      }
    } finally {
      setLoadingAction(null);
    }
  }

  async function tip(amount_cents = 500, message = '') {
    try {
      const which = amount_cents === 500 ? 'tip5' : amount_cents === 1000 ? 'tip10' : null;
      if (which) setLoadingAction(which as any);

      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tip', amount_cents, message }),
      });
      const t = await r.text();
      try {
        const j = JSON.parse(t);
        if (j.error) alert(j.error);
        else if (j.url) window.location.href = j.url;
      } catch {
        alert('Checkout failed: ' + t);
      }
    } finally {
      setLoadingAction(null);
    }
  }

  const holderLabel = seat?.holder_name ?? '—';
  const priceLabel = fmtUSD(seat?.current_price_cents ?? 500);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Cosmic / Bonnaroo-ish background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-500 opacity-40 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500 opacity-40 blur-3xl animate-orbit" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.05),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.85)_75%,_black_100%)]" />
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.15]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 lg:flex-row lg:items-start lg:py-14">
        {/* LEFT: Hero + video + controls */}
        <section className="flex-1 space-y-6">
          {/* Hero badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.25em] text-fuchsia-100 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(190,242,100,0.8)]" />
            Live • Today&apos;s World
          </div>

          {/* Hero text */}
          <div className="space-y-3">
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-fuchsia-300 via-amber-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(244,114,182,0.6)]">
                The World&apos;s Daily Message,
              </span>
              <br />
              <span className="text-white/90">one voice at a time.</span>
            </h1>
            <p className="max-w-xl text-sm text-neutral-200/80 sm:text-base">
              One liveline out to the planet. Whoever holds the mic owns the next ten minutes of the world&apos;s
              attention. No algorithm. No scrolling. Just you and whoever&apos;s listening.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-300/70">Current holder</p>
              <p className="mt-2 text-sm font-semibold text-white">{holderLabel}</p>
              <p className="mt-1 text-[0.7rem] text-neutral-300/70">On the mic right now.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-300/70">Time left</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-lime-300">{countdown}</p>
              <p className="mt-1 text-[0.7rem] text-neutral-300/70">Hard floor of 10 minutes.</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/20 via-cyan-500/10 to-amber-400/10 p-4 backdrop-blur-md sm:col-span-1">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-100/80">Seat price</p>
              <p className="mt-2 text-xl font-semibold text-white">{priceLabel}</p>
              <p className="mt-1 text-[0.7rem] text-neutral-100/80">Climbs with each takeover.</p>
            </div>
          </div>

          {/* Video + controls */}
          <div className="space-y-4">
            {/* Player card */}
            <div className="relative rounded-3xl border border-white/15 bg-black/60 p-3 shadow-[0_0_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-8 -top-10 h-24 rounded-full bg-gradient-to-r from-fuchsia-500/40 via-amber-400/40 to-cyan-400/40 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
                <div className="aspect-video w-full bg-black">
                  <HlsPlayer src={videoSrc} poster="/poster.jpg" />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/60 px-4 py-3 text-xs backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-400" />
                    </span>
                    <span className="font-medium uppercase tracking-[0.2em] text-neutral-50">Live broadcast</span>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-neutral-100">
                    Today&apos;s Message • Global
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2 rounded-3xl border border-fuchsia-400/50 bg-gradient-to-br from-fuchsia-600/30 via-slate-950 to-cyan-500/20 p-4 shadow-[0_0_45px_rgba(244,114,182,0.6)] backdrop-blur-xl">
              <p className="text-[0.7rem] uppercase tracking-[0.24em] text-fuchsia-50/90">Take the mic</p>
              <div className="space-y-3">
                <button
                  onClick={buySeat}
                  disabled={!!loadingAction}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-400 via-amber-300 to-lime-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_18px_40px_rgba(0,0,0,0.55)] transition-transform duration-150 ease-out hover:-translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-fuchsia-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingAction === 'seat' ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-[2px] border-slate-900/60 border-t-transparent" />
                      Starting checkout…
                    </span>
                  ) : (
                    <>
                      Buy the Mic
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-900/80 group-hover:translate-x-[1px] group-hover:text-slate-900 transition">
                        Own 10 Minutes
                      </span>
                    </>
                  )}
                </button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => tip(500)}
                    disabled={!!loadingAction}
                    className="flex items-center justify-center rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs font-medium text-neutral-50 shadow-[0_12px_30px_rgba(0,0,0,0.6)] transition hover:border-amber-200/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingAction === 'tip5' ? 'Sending Tip…' : 'Tip $5'}
                  </button>
                  <button
                    onClick={() => tip(1000)}
                    disabled={!!loadingAction}
                    className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-fuchsia-100 transition hover:border-fuchsia-300/80 hover:bg-fuchsia-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingAction === 'tip10' ? 'Sending Tip…' : 'Tip $10'}
                  </button>
                </div>

                <p className="text-[0.65rem] text-neutral-200/75">
                  Your support keeps the stream alive and writes your name onto the Wall of Holders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: Chat + Wall */}
        <section className="flex w-full max-w-md flex-1 flex-col gap-4">
          <div className="rounded-3xl border border-white/12 bg-black/75 p-4 backdrop-blur-xl">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-200 uppercase">
              Live Chat
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              Say hi, react to the holder, or send them love while they&apos;re live.
            </p>
            <div className="mt-3">
              <Chat />
            </div>
          </div>

          <div className="rounded-3xl border border-white/12 bg-gradient-to-r from-slate-950 via-slate-900/70 to-slate-950 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-200 uppercase">
                  Wall of Holders
                </h2>
                <p className="text-xs text-neutral-300/80">
                  Every mic session gets carved here with your name and timestamp.
                </p>
              </div>
            </div>
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
    <div className="flex h-[420px] flex-col rounded-2xl border border-white/10 bg-black/60 p-3 text-sm">
      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {messages.map((m: any) => {
          const isTip = !!m.is_tip;
          const color = m.color ?? (isTip ? '#d97706' : 'inherit');
          return (
            <div
              key={m.id}
              className={`text-xs sm:text-sm ${isTip ? 'font-bold' : ''}`}
              style={{ color }}
            >
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
          className="rounded-xl bg-gradient-to-r from-fuchsia-400 to-amber-300 px-3 py-1 text-xs font-semibold text-slate-900"
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3">
      {entries.map((w: any) => (
        <div
          key={w.id}
          className="rounded-xl border border-white/8 bg-white/5 p-3 text-xs text-neutral-100"
        >
          <div className="text-sm font-medium">{w.display_name ?? 'Holder'}</div>
          <div className="mt-1 text-[0.7rem] opacity-70">
            {new Date(w.started_at).toLocaleString()}
          </div>
        </div>
      ))}
      {entries.length === 0 && (
        <div className="col-span-full rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-neutral-400">
          No holders yet — be the first to light up the Wall. 🎤
        </div>
      )}
    </div>
  );
}


