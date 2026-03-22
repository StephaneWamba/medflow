"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface VideoTokenResponse { token: string; roomName: string; }

export default function VideoRoomPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage first (set by appointment detail page)
    const savedToken = localStorage.getItem("lk_token");
    const savedRoom = localStorage.getItem("lk_room");
    if (savedToken && savedRoom) {
      setToken(savedToken);
      setRoomName(savedRoom);
      setLoading(false);
      return;
    }
    // Otherwise fetch fresh
    api.get<VideoTokenResponse>(`/appointments/${appointmentId}/video-token`)
      .then(({ token: t, roomName: r }) => {
        setToken(t);
        setRoomName(r);
        localStorage.setItem("lk_token", t);
        localStorage.setItem("lk_room", r);
      })
      .catch(() => setError("Could not join the video call. Please check the appointment is confirmed."))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  function handleLeave() {
    localStorage.removeItem("lk_token");
    localStorage.removeItem("lk_room");
    router.back();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[var(--color-fg)] flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 opacity-60" />
          <p className="font-medium">Connecting to your consultation…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[var(--color-canvas)]">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-[var(--color-danger)] mx-auto mb-4" />
          <h2 className="font-display text-xl text-[var(--color-fg)] mb-2">Cannot join call</h2>
          <p className="text-sm text-[var(--color-fg-muted)] mb-6">{error}</p>
          <Button onClick={() => router.back()}>Go back</Button>
        </div>
      </div>
    );
  }

  // Dynamic import of LiveKit to avoid SSR issues
  return <LiveKitRoom token={token!} roomName={roomName!} onLeave={handleLeave} />;
}

function LiveKitRoom({ token, roomName, onLeave }: { token: string; roomName: string; onLeave: () => void }) {
  const [LiveKitComponents, setComponents] = useState<any>(null);

  useEffect(() => {
    import("@livekit/components-react").then((mod) => {
      setComponents(mod);
    });
  }, []);

  if (!LiveKitComponents) {
    return (
      <div className="fixed inset-0 bg-[var(--color-fg)] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-white opacity-60" />
      </div>
    );
  }

  const { LiveKitRoom: Room, VideoConference } = LiveKitComponents;

  return (
    <div className="fixed inset-0 z-[9999]" data-lk-theme="default">
      <Room
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "wss://medflow-lx4oa6ow.livekit.cloud"}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={onLeave}
        style={{ height: "100dvh" }}
        options={{
          adaptiveStream: true,
          dynacast: true,
          rtcConfig: {
            // "relay" forces all traffic through TURN servers — fixes connectivity
            // for users behind strict NAT or ISPs that block UDP (common in Africa)
            iceTransportPolicy: "relay",
          },
        }}
      >
        <VideoConference />
      </Room>
    </div>
  );
}
