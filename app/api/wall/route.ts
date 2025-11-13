export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { noContent } from "../_cors";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('wall_entries')
    .select('*')
    .order('id', { ascending: false })
    .limit(40);

  if (error) console.error('wall error:', error);

  return NextResponse.json(
    { entries: data ?? [] },
    { headers: { 'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN! } }
  );
}
