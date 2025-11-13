export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


import { okJson, noContent } from "../_cors";

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';



// --- tiny in-memory rate limiter (per instance) ---
const HIT_WINDOW_MS = 2000;    // 1 msg / 2s
const BURST = 3;               // allow short bursts
const hits = new Map<string, number[]>();

function getIp(req: Request) {
  const h = new Headers(req.headers);
  // try common proxies first
  const fwd = h.get('x-forwarded-for') || h.get('cf-connecting-ip') || h.get('x-real-ip') || '';
  const ip = fwd.split(',')[0].trim();
  return ip || 'unknown';
}

function allowRequest(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < HIT_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  // Limit: at most BURST events in the rolling window
  return arr.length <= BURST;
}

export async function POST(req: Request) {
  try {
    const ip = getIp(req);
    if (!allowRequest(ip)) {
      return NextResponse.json({ error: 'Slow down' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const username = String(body.username || 'anon').slice(0, 40).trim() || 'anon';
    const text = String(body.text || '').slice(0, 200).trim();
    if (!text) throw new Error('Empty message');

    const { error } = await supabaseAdmin.from('chat_messages').insert([
      { username, text }
    ]);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('chat insert error:', err);
    return NextResponse.json({ error: err?.message || 'Error' }, { status: 400 });
  }
}
