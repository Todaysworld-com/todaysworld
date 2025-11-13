export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { noContent } from "../_cors";

import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    node_env: process.env.NODE_ENV,
    stripe_key_set: !!process.env.STRIPE_SECRET_KEY,
  });
}
export async function OPTIONS() { return noContent(); }


