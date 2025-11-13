'use client';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-black/70 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold">
          Today’s World
        </Link>
        <nav className="flex gap-4">
          <Link href="/pricing" className="hover:underline">
            Pricing
          </Link>
          <Link href="/account" className="hover:underline">
            Account
          </Link>
        </nav>
      </div>
    </header>
  );
}
