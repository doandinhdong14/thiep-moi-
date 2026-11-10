"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Heart, Sparkles } from "lucide-react";

interface GalaxyRainMotionProps {
  loveMessages?: string[];
  galleryUrls?: string[];
  coverImageUrl?: string;
}

interface Particle {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  layer: number; // 0: background, 1: mid, 2: foreground
  rotation: number;
  color: string;
}

export default function GalaxyRainMotion({
  loveMessages = [],
  galleryUrls = [],
  coverImageUrl,
}: GalaxyRainMotionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultMessages = useMemo(
    () => [
      "Em là điều tuyệt vời nhất ❤️",
      "Nụ cười của em là nắng ☀️",
      "Anh nhớ em ✨",
      "Thương em hơn hôm qua 💖",
      "Yêu em mãi mãi 🌹",
      "Bên nhau bình yên 💫",
    ],
    []
  );

  const activeMessages = useMemo(() => {
    return loveMessages.length > 0 ? loveMessages : defaultMessages;
  }, [loveMessages, defaultMessages]);

  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate initial rain particles
    const colors = ["#ff4d79", "#ff7597", "#fca5a5", "#c084fc", "#e879f9", "#ffffff", "#ffd166"];
    const count = Math.min(Math.max(activeMessages.length * 2, 12), 24);

    const initial: Particle[] = Array.from({ length: count }, (_, i) => {
      const msg = activeMessages[i % activeMessages.length];
      return {
        id: i,
        text: msg,
        x: Math.random() * 85 + 5, // 5% to 90% horizontal
        y: Math.random() * -120 - (i * 25), // Staggered above viewport
        speed: 0.35 + Math.random() * 0.45,
        size: 11 + Math.random() * 5,
        opacity: 0.7 + Math.random() * 0.3,
        layer: i % 3,
        rotation: (Math.random() - 0.5) * 16,
        color: colors[i % colors.length],
      };
    });

    setParticles(initial);

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 16, 2);
      lastTime = time;

      setParticles((prev) =>
        prev.map((p) => {
          let newY = p.y + p.speed * delta * 1.5;
          let newX = p.x;
          // Loop when below viewport (120%)
          if (newY > 120) {
            newY = -20 - Math.random() * 30;
            newX = Math.random() * 85 + 5;
          }
          return {
            ...p,
            y: newY,
            x: newX,
          };
        })
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeMessages]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {/* 1. Deep Space Twinkling Stars */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/60 via-slate-950/80 to-black pointer-events-none" />

      {/* Floating Star sparkles */}
      <div className="absolute top-10 left-8 text-amber-200/40 animate-pulse text-xs">✨</div>
      <div className="absolute top-1/4 right-12 text-rose-300/40 animate-ping text-sm" style={{ animationDuration: "3s" }}>⭐</div>
      <div className="absolute top-1/2 left-10 text-purple-300/30 animate-pulse text-xs" style={{ animationDuration: "4s" }}>✨</div>
      <div className="absolute bottom-1/4 right-8 text-pink-300/40 animate-ping text-xs" style={{ animationDuration: "5s" }}>💖</div>

      {/* Floating Polaroids in background (gentle depth) */}
      {coverImageUrl && (
        <div
          className="absolute top-28 -right-6 w-24 h-32 rounded-xl bg-white/10 backdrop-blur-md p-1.5 shadow-xl border border-white/20 -rotate-12 opacity-40 transform hover:scale-105 transition-all duration-700 pointer-events-none"
        >
          <img src={coverImageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
        </div>
      )}

      {galleryUrls[0] && (
        <div
          className="absolute bottom-40 -left-6 w-24 h-32 rounded-xl bg-white/10 backdrop-blur-md p-1.5 shadow-xl border border-white/20 rotate-12 opacity-35 transform pointer-events-none"
        >
          <img src={galleryUrls[0]} alt="" className="w-full h-full object-cover rounded-lg" />
        </div>
      )}

      {/* 2. Raining Words & Hearts Layer */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute transform transition-transform duration-75 will-change-transform"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `rotate(${p.rotation}deg) scale(${p.layer === 0 ? 0.85 : p.layer === 1 ? 1 : 1.15})`,
            zIndex: p.layer,
            opacity: p.layer === 0 ? p.opacity * 0.6 : p.opacity,
          }}
        >
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs shadow-md border inline-flex items-center gap-1.5 whitespace-nowrap"
            style={{
              backgroundColor: "rgba(18, 12, 38, 0.75)",
              borderColor: `${p.color}55`,
              color: p.color,
              fontSize: `${p.size}px`,
              textShadow: `0 0 10px ${p.color}66`,
              boxShadow: `0 4px 14px rgba(0,0,0,0.4), 0 0 12px ${p.color}33`,
            }}
          >
            <Heart className="w-3 h-3 fill-current inline-block" />
            <span>{p.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

