import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { okJson, noContent } from "../_cors";

export async function GET() {
  const { data } = await supabaseAdmin
    .from("seat_state")
    .select("*")
    .eq("id", 1)
    .single();

  return okJson({
    price_cents: data?.current_price_cents ?? 500,
    holder_name: data?.holder_name ?? null,
    expires_at: data?.expires_at ?? null,
    hls_url: process.env.NEXT_PUBLIC_HLS_URL,
  });
}

export async function OPTIONS() {
  return noContent();
}


