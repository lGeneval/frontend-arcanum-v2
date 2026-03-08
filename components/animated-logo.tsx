"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  hue: number;
}

export function AnimatedLogo({ size = 40 }: { size?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Chaotic particles around logo
    const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 60,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.6 + 0.4,
      hue: Math.random() * 60 + 260, // Purple to pink
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div 
      className="relative cursor-pointer" 
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Chaotic floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: isHovered ? particle.size * 1.5 : particle.size,
            height: isHovered ? particle.size * 1.5 : particle.size,
            left: '50%',
            top: '50%',
            background: `radial-gradient(circle, hsla(${particle.hue}, 80%, 70%, ${particle.opacity}) 0%, hsla(${particle.hue}, 70%, 50%, ${particle.opacity * 0.5}) 50%, transparent 70%)`,
            boxShadow: `0 0 ${particle.size * 3}px hsla(${particle.hue}, 80%, 60%, ${particle.opacity * 0.6})`,
            animation: `chaotic-float-${particle.id % 4} ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
            transition: 'width 0.3s, height 0.3s',
          }}
        />
      ))}
      
      {/* Main logo - no background container */}
      <div className={`relative z-10 w-full h-full transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
        <Image
          src="/images/logo.png"
          alt="Arkanum"
          fill
          className="object-contain"
          style={{
            filter: `drop-shadow(0 0 ${isHovered ? 12 : 6}px rgba(139,92,246,${isHovered ? 0.5 : 0.3}))`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes chaotic-float-0 {
          0%, 100% { transform: translate(-50%, -50%) translate(-20px, -15px) scale(1); opacity: 0.4; }
          25% { transform: translate(-50%, -50%) translate(15px, -25px) scale(1.3); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) translate(25px, 10px) scale(0.8); opacity: 0.5; }
          75% { transform: translate(-50%, -50%) translate(-10px, 20px) scale(1.1); opacity: 0.7; }
        }
        @keyframes chaotic-float-1 {
          0%, 100% { transform: translate(-50%, -50%) translate(25px, -20px) scale(1); opacity: 0.5; }
          25% { transform: translate(-50%, -50%) translate(-15px, 15px) scale(0.9); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) translate(-25px, -10px) scale(1.2); opacity: 0.4; }
          75% { transform: translate(-50%, -50%) translate(10px, 25px) scale(1); opacity: 0.8; }
        }
        @keyframes chaotic-float-2 {
          0%, 100% { transform: translate(-50%, -50%) translate(10px, 25px) scale(0.9); opacity: 0.6; }
          25% { transform: translate(-50%, -50%) translate(-25px, -5px) scale(1.1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) translate(20px, -20px) scale(1.3); opacity: 0.8; }
          75% { transform: translate(-50%, -50%) translate(-15px, 15px) scale(0.8); opacity: 0.5; }
        }
        @keyframes chaotic-float-3 {
          0%, 100% { transform: translate(-50%, -50%) translate(-15px, 20px) scale(1.1); opacity: 0.5; }
          25% { transform: translate(-50%, -50%) translate(20px, 5px) scale(0.8); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) translate(-10px, -25px) scale(1); opacity: 0.6; }
          75% { transform: translate(-50%, -50%) translate(25px, -15px) scale(1.2); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
