'use client';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

type Props = { src: string; poster?: string };

export default function HlsPlayer({ src, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current!;
    if (!video) return;

    video.muted = muted;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else {
      video.src = src;
    }
  }, [src, muted]);

  const unmute = () => {
    const v = videoRef.current!;
    v.muted = false;
    setMuted(false);
    v.play?.().catch(() => {});
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        poster={poster}
        className="w-full rounded-2xl"
        playsInline
        autoPlay
        controls
        muted={muted}
      />
      {muted && (
        <button
          onClick={unmute}
          className="absolute bottom-4 left-4 rounded-lg px-3 py-1 bg-black/70 text-white text-sm"
        >
          🔇 Tap to unmute
        </button>
      )}
    </div>
  );
}
