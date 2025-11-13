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

  const fallbackSrc = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  const videoSrc = useMemo(() => seat?.hls_url || fallbackSrc, [seat?.hls_url]);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.from('seat_state')
      .select('*')
      .then(({ data }: { data: any[] | null }) => {
        if (data?.length) setSeat(data[0] as SeatState);
      });
    const ch = sb
      .channel('seat_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_state' }, (p: { new: SeatState }) => setSeat(p.new))
      .subscribe();
    return () => { void sb.removeChannel(ch); };
  }, []);

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
    } catch { alert('Checkout failed: ' + t); }
  }

  async function tip(amount_cents = 500, message = '') {
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
    } catch { alert('Checkout failed: ' + t); }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">The World’s Daily Message</h1>
        <p className="text-neutral-400">One message. Updated daily. Clean, ad-free.</p>
      </header>

      {/* Video + Chat side-by-side */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        <div className="md:col-span-2 space-y-3">
          <HlsPlayer src={videoSrc} poster="/poster.jpg" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm border rounded-xl px-3 py-2">
            <div>Holder: <b>{seat?.holder_name ?? '—'}</b></div>
            <div>Price: <b>{fmtUSD(seat?.current_price_cents ?? 500)}</b></div>
            <div>Ends in: <b>{countdown}</b></div>
          </div>
          <div className="flex gap-2">
            <button onClick={buySeat} className="px-4 py-2 rounded-xl bg-black text-white">Buy Mic</button>
            <button onClick={() => tip(500)} className="px-4 py-2 rounded-xl border">Tip $5</button>
            <button onClick={() => tip(1000)} className="px-4 py-2 rounded-xl border">Tip $10</button>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Live Chat</h2>
          <Chat />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Wall of Holders</h2>
        <Wall />
      </section>
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
        .then(r => r.json())
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
    <div className="border rounded-2xl p-3 h-[520px] flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-1">
        {messages.map((m: any) => {
          const isTip = !!m.is_tip;
          const color = m.color ?? (isTip ? '#d97706' : 'inherit');
          return (
            <div key={m.id} className={`text-sm ${isTip ? 'font-bold' : ''}`} style={{ color }}>
              {isTip && <span className="mr-1">💸</span>}
              <span className="opacity-60">{m.username}:</span> {m.text}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Name (optional)" className="border rounded px-2 py-1 flex-1" />
      </div>
      <div className="mt-2 flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Say something…" className="border rounded px-2 py-1 flex-1" />
        <button onClick={send} className="px-3 py-1 rounded bg-black text-white">Send</button>
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {entries.map((w: any) => (
        <div key={w.id} className="border rounded-xl p-3">
          <div className="text-sm font-medium">{w.display_name ?? 'Holder'}</div>
          <div className="text-xs opacity-60">{new Date(w.started_at).toLocaleString()}</div>
        </div>
      ))}
      {entries.length === 0 && (
        <div className="col-span-full text-sm text-neutral-500 border rounded-xl p-4 text-center">
          No holders yet — be the first! 🎤
        </div>
      )}
    </div>
  );
}


