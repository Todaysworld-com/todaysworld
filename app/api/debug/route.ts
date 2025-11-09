import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success_url: process.env.SUCCESS_URL,
    node_env: process.env.NODE_ENV,
    stripe_key_set: !!process.env.STRIPE_SECRET_KEY,
  });
}

