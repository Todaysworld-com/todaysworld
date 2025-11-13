export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { noContent } from "../_cors";

import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: Request) {
  const { identity, isPublisher } = await req.json();
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity: identity || `guest-${Date.now()}` }
  );
  at.addGrant({
    roomJoin: true,
    room: "world-mic",
    canPublish: !!isPublisher,
    canSubscribe: true,
  });
  return NextResponse.json({ token: await at.toJwt() });
}
export async function OPTIONS() { return noContent(); }
