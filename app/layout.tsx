import './globals.css';
import Header from '@/app/components/Header';

export const metadata = {
  title: "Today's World",
  description: "The daily message for the world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-neutral-950 text-neutral-100">
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

