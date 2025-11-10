import { supabaseAdmin } from "@/lib/supabase";
import { okJson, noContent } from "../_cors";

export async function POST(req: Request) {
  const { username, text } = await req.json();
  const name = (username || "").trim().slice(0, 24) || `Guest-${Math.floor(Math.random() * 9999)}`;
  const msg = (text || "").toString().slice(0, 280);
  if (!msg) return new Response(JSON.stringify({ ok: false }), { status: 400 });

  await supabaseAdmin.from("chat_messages").insert({ username: name, text: msg });
  return okJson({ ok: true });
}

export async function OPTIONS() { return noContent(); }
