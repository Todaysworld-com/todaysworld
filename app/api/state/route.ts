// app/api/state/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("seat_state").select("*").limit(1);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const row = data?.[0] || null;
  return NextResponse.json({
    price_cents: row?.current_price_cents ?? 500,
    holder_name: row?.holder_name ?? null,
    expires_at: row?.expires_at ?? null,
    hls_url: row?.hls_url ?? null,
  });
}
