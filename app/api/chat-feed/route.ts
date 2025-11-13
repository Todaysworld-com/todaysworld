export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


import { okJson, noContent } from "../_cors";

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .order('id', { ascending: false })
    .limit(100);

  if (error) console.error('chat-feed error:', error);

  return NextResponse.json(
    { messages: (data ?? []).reverse() },
    { headers: { 'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN! } }
  );
}
