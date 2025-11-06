'use client';
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current!;
    if (!video || !src) return;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src; // Safari
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else {
      console.warn('HLS not supported in this browser');
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      poster={poster}
      className="aspect-video w-full rounded-2xl ring-1 ring-white/10"
      playsInline
    />
  );
}
