"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  hue: number;
  velocityX: number;
  velocityY: number;
  life: number;
}

interface MagicButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  onClick?: () => void;
}

export function MagicButton({ children, className = "", variant = "default", size = "default", onClick }: MagicButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const animationRef = useRef<number | null>(null);

  // Spawn chaotic particles continuously while hovered
  useEffect(() => {
    if (!isHovered || !buttonRef.current) {
      setParticles([]);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    let lastSpawn = 0;

    const animate = (time: number) => {
      // Spawn new particles every 100ms
      if (time - lastSpawn > 100) {
        lastSpawn = time;
        const newParticle: Particle = {
          id: Date.now() + Math.random(),
          x: Math.random() * (rect.width + 40) - 20,
          y: Math.random() * (rect.height + 40) - 20,
          size: Math.random() * 4 + 2,
          hue: Math.random() * 60 + 260,
          velocityX: (Math.random() - 0.5) * 2,
          velocityY: (Math.random() - 0.5) * 2,
          life: 1,
        };
        
        setParticles(prev => {
          const updated = prev
            .map(p => ({
              ...p,
              x: p.x + p.velocityX,
              y: p.y + p.velocityY,
              life: p.life - 0.02,
            }))
            .filter(p => p.life > 0);
          return [...updated, newParticle].slice(-20);
        });
      } else {
        // Just update positions
        setParticles(prev => 
          prev
            .map(p => ({
              ...p,
              x: p.x + p.velocityX,
              y: p.y + p.velocityY,
              velocityX: p.velocityX + (Math.random() - 0.5) * 0.3,
              velocityY: p.velocityY + (Math.random() - 0.5) * 0.3,
              life: p.life - 0.008,
            }))
            .filter(p => p.life > 0)
        );
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered]);

  return (
    <div className="relative inline-block">
      <Button
        ref={buttonRef}
        variant={variant}
        size={size}
        className={`relative overflow-visible transition-all duration-300 ${isHovered ? 'scale-105 shadow-lg shadow-purple-500/20' : ''} ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        {children}
      </Button>
      
      {/* Chaotic floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              opacity: particle.life,
              background: `radial-gradient(circle, hsla(${particle.hue}, 80%, 70%, 0.9) 0%, hsla(${particle.hue}, 70%, 50%, 0.5) 50%, transparent 70%)`,
              boxShadow: `0 0 ${particle.size * 2}px hsla(${particle.hue}, 80%, 60%, ${particle.life * 0.5})`,
              transition: 'opacity 0.1s ease-out',
            }}
          />
        ))}
      </div>
    </div>
  );
}
