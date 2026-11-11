"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { TemplateTheme } from "@/lib/templates/registry";

interface MusicControlBlockProps {
  musicUrl?: string | null;
  theme: TemplateTheme;
}

export default function MusicControlBlock({ musicUrl, theme }: MusicControlBlockProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicUrl) return;

    let started = false;
    const tryPlay = () => {
      const p = audio.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          started = true;
          setIsPlaying(true);
        }).catch(() => {});
      }
    };

    tryPlay();

    const unlockOnGesture = () => {
      if (started && !audio.paused) return;
      tryPlay();
    };

    const events: (keyof DocumentEventMap)[] = ["pointerdown", "touchstart", "click", "keydown"];
    events.forEach((evt) => document.addEventListener(evt, unlockOnGesture, { once: true, passive: true }));
    return () => {
      events.forEach((evt) => document.removeEventListener(evt, unlockOnGesture));
    };
  }, [musicUrl]);

  if (!musicUrl) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <audio ref={audioRef} src={musicUrl} loop preload="auto" playsInline />
      <div
        className="flex items-center gap-1.5 p-2 rounded-full shadow-lg border backdrop-blur-md"
        style={{
          backgroundColor: `${theme.cardBg}E6`,
          borderColor: `${theme.accent}40`,
        }}
      >
        <button
          onClick={togglePlay}
          title={isPlaying ? "Tạm dừng nhạc" : "Phát nhạc nền"}
          className="p-2.5 rounded-full text-white transition-transform hover:scale-105"
          style={{ backgroundColor: theme.accent }}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleMute}
          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          className="p-2 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

