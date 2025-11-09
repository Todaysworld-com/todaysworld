export const dynamic = "force-dynamic";

export default function SuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const sid = searchParams?.session_id;
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">✅ Payment complete</h1>
      <p>Thanks! Your seat purchase went through.</p>
      {sid && (
        <p className="text-sm text-neutral-400">
          Session ID: <code>{sid}</code>
        </p>
      )}
      <a href="/" className="inline-block rounded bg-white text-black px-4 py-2">Go home</a>
    </main>
  );
}
