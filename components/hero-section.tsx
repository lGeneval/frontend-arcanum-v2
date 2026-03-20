"use client";
 
import { useEffect, useState, useRef } from "react";
import { Apple, Monitor, Smartphone, Tv, Chrome, Terminal, ArrowRight, Sparkles } from "lucide-react";
import { MagicButton } from "./magic-button";
import Link from "next/link";
 
const platforms = [
  { name: "iOS", icon: Apple },
  { name: "Android", icon: Smartphone },
  { name: "Windows", icon: Monitor },
  { name: "macOS", icon: Apple },
  { name: "Android TV", icon: Tv },
  { name: "Browser", icon: Chrome },
  { name: "Linux", icon: Terminal },
];
 
interface MagicParticle {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  hue: number;
}
 
export function HeroSection() {
  const [particles, setParticles] = useState<MagicParticle[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
 
  useEffect(() => {
    const newParticles: MagicParticle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      hue: Math.random() * 60 + 260,
    }));
    setParticles(newParticles);
  }, []);
 
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Video background with blur */}
      <div className="absolute inset-0 -z-20">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%230a0a12' width='1920' height='1080'/%3E%3C/svg%3E"
        >
          <source 
            src="https://cdn.pixabay.com/video/2020/05/25/40130-424930941_large.mp4" 
            type="video/mp4" 
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>
 
      {/* Animated background overlay */}
      <div className="absolute inset-0 -z-10">
        {/* Mystical ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/8 rounded-full blur-[80px]" style={{ animation: "pulse-glow 4s ease-in-out infinite", animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-900/5 to-transparent rounded-full" />
 
        {/* Mystical particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
              background: `radial-gradient(circle, hsla(${particle.hue}, 70%, 70%, 0.8) 0%, hsla(${particle.hue}, 60%, 50%, 0.4) 50%, transparent 70%)`,
              boxShadow: `0 0 ${particle.size * 4}px hsla(${particle.hue}, 70%, 60%, 0.6)`,
              animation: `mystical-float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
 
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>
 
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8 backdrop-blur-sm hover:bg-purple-500/20 hover:border-purple-400/40 transition-all duration-300 cursor-default">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-sm text-purple-300">Твоя приватность под защитой</span>
          </div>
        </div>
 
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s", fontFamily: "serif" }}>
          <span className="text-foreground drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">Защитите</span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_40px_rgba(167,139,250,0.4)]">
            тайное
          </span>
        </h1>
 
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up leading-relaxed" style={{ animationDelay: "0.2s" }}>
          Интернет без границ и слежки. Один аккаунт — защита для всех ваших устройств.
        </p>
 
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Link href="/login">
            <MagicButton 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 text-lg px-8 py-6 border border-purple-400/30"
            >
              Начать бесплатно
              <ArrowRight className="w-5 h-5 ml-2" />
            </MagicButton>
          </Link>
          <MagicButton 
            size="lg" 
            variant="outline" 
            className="border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-400/50 text-lg px-8 py-6"
            onClick={() => {
              document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Узнать больше
          </MagicButton>
        </div>
 
        <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <p className="text-sm text-muted-foreground mb-6">Доступно на всех платформах</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {platforms.map((platform, index) => (
              <PlatformButton key={platform.name} platform={platform} index={index} />
            ))}
          </div>
        </div>
      </div>
 
      <style jsx>{`
        @keyframes mystical-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          33% {
            transform: translate(20px, -30px) scale(1.3);
            opacity: 0.8;
          }
          66% {
            transform: translate(-15px, -50px) scale(0.7);
            opacity: 0.5;
          }
        }
      `}</style>
    </section>
  );
}
 
function PlatformButton({ platform, index }: { platform: { name: string; icon: React.ElementType }; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
 
  useEffect(() => {
    if (!isHovered) {
      setSparkles([]);
      return;
    }
 
    const interval = setInterval(() => {
      setSparkles(prev => {
        const newSparkle = {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
        };
        return [...prev.slice(-8), newSparkle];
      });
    }, 100);
 
    return () => clearInterval(interval);
  }, [isHovered]);
 
  return (
    <button
      onClick={() => {
        document.querySelector('#download')?.scrollIntoView({ behavior: 'smooth' });
      }}
      className="group relative flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary/50 border border-border hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 backdrop-blur-sm overflow-hidden"
      style={{ animationDelay: `${index * 0.1}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sparkles on hover */}
      {sparkles.map(sparkle => (
        <span
          key={sparkle.id}
          className="absolute w-1 h-1 bg-purple-400 rounded-full pointer-events-none animate-ping"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
          }}
        />
      ))}
 
      <platform.icon className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 transition-colors relative z-10" />
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors relative z-10">
        {platform.name}
      </span>
    </button>
  );
}