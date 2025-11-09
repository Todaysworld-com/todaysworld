// lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Keep this pinned to a real Stripe API version you support
  apiVersion: '2024-06-20' as any,
});
