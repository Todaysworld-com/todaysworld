import HlsPlayer from '@/components/HlsPlayer';

export default function Page() {
  const testSrc = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">The World’s Daily Message</h1>
      <p className="text-neutral-300">
        One message. Updated daily. The clean, ad-free experience.
      </p>
      <HlsPlayer src={testSrc} poster="/poster.jpg" />
    </div>
  );
}

