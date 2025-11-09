'use client'
import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

export default function WorldPage() {
  const [token, setToken] = useState<string>();
  const [role, setRole] = useState<"publisher"|"viewer">("viewer");

  async function join(r: "publisher"|"viewer") {
    setRole(r);
    const res = await fetch("/api/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identity: `alex-${Math.random().toString(36).slice(2,8)}`, isPublisher: r==="publisher" })
    });
    const { token } = await res.json();
    setToken(token);
  }

  if (!token) {
    return (
      <div className="p-8 space-x-4">
        <button className="px-4 py-2 rounded bg-white text-black" onClick={() => join("publisher")}>Join as Mic Holder</button>
        <button className="px-4 py-2 rounded border" onClick={() => join("viewer")}>Join as Viewer</button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LK_URL || process.env.LIVEKIT_URL}
      token={token}
      data-lk-theme="default"
      style={{ height: "100vh" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}

