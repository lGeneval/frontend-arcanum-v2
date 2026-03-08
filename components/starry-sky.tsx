"use client";

import { useEffect, useState } from "react";

interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  opacity: number;
  twinkleDuration: number;
  twinkleDelay: number;
}

interface MagicParticle {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  hue: number;
  driftX: number;
  driftY: number;
}

export function StarrySky() {
  const [stars, setStars] = useState<Star[]>([]);
  const [particles, setParticles] = useState<MagicParticle[]>([]);

  useEffect(() => {
    // Generate stars (like Rolls Royce ceiling)
    const newStars: Star[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      twinkleDuration: Math.random() * 3 + 2,
      twinkleDelay: Math.random() * 5,
    }));
    setStars(newStars);

    // Generate magical particles
    const newParticles: MagicParticle[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      hue: Math.random() * 60 + 260, // Purple to pink
      driftX: (Math.random() - 0.5) * 200,
      driftY: (Math.random() - 0.5) * 200,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Stars layer */}
      {stars.map((star) => (
        <div
          key={`star-${star.id}`}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animation: `star-twinkle ${star.twinkleDuration}s ease-in-out infinite`,
            animationDelay: `${star.twinkleDelay}s`,
          }}
        />
      ))}

      {/* Magic particles layer */}
      {particles.map((particle) => (
        <div
          key={`particle-${particle.id}`}
          className="absolute rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, hsla(${particle.hue}, 80%, 70%, 0.8) 0%, hsla(${particle.hue}, 70%, 50%, 0.4) 50%, transparent 70%)`,
            boxShadow: `0 0 ${particle.size * 6}px hsla(${particle.hue}, 80%, 60%, 0.6)`,
            animation: `magic-drift ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
            ["--drift-x" as string]: `${particle.driftX}px`,
            ["--drift-y" as string]: `${particle.driftY}px`,
          }}
        />
      ))}

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-[10%] w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute top-1/2 right-[5%] w-[250px] h-[250px] bg-pink-600/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-1/4 left-[15%] w-[200px] h-[200px] bg-violet-600/5 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: "4s" }} />

      <style jsx>{`
        @keyframes star-twinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes magic-drift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(calc(var(--drift-x) * 0.3), calc(var(--drift-y) * -0.5)) scale(1.3);
            opacity: 0.7;
          }
          50% {
            transform: translate(calc(var(--drift-x) * -0.2), calc(var(--drift-y) * 0.3)) scale(0.8);
            opacity: 0.5;
          }
          75% {
            transform: translate(calc(var(--drift-x) * 0.5), calc(var(--drift-y) * -0.2)) scale(1.1);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
