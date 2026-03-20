"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { StarrySky } from "@/components/starry-sky"

interface MagicParticle {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
  hue: number
}

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [particles, setParticles] = useState<MagicParticle[]>([])
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([])

  useEffect(() => {
    const user = localStorage.getItem("arcanum_user")
    if (user) {
      router.replace("/dashboard")
    } else {
      setIsLoading(false)
    }

    // Частицы как на главной
    const newParticles: MagicParticle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      hue: Math.random() * 60 + 260,
    }))
    setParticles(newParticles)
  }, [router])

  // Sparkles эффект при наведении (как PlatformButton на главной)
  useEffect(() => {
    if (!hoveredBtn) {
      setSparkles([])
      return
    }

    const interval = setInterval(() => {
      setSparkles((prev) => {
        const newSparkle = {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
        }
        return [...prev.slice(-8), newSparkle]
      })
    }, 100)

    return () => clearInterval(interval)
  }, [hoveredBtn])

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      alert("Ошибка входа: " + error.message)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">

      {/* Звёздное небо */}
      <StarrySky />

      {/* Мистические частицы как на hero */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse-glow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/8 rounded-full blur-[80px]"
          style={{ animation: "pulse-glow 4s ease-in-out infinite", animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-900/5 to-transparent rounded-full" />

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

        {/* Сетка как на главной */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-16">

        {/* Назад — с анимацией */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 mb-16 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">На главную</span>
        </Link>

        {/* Карточка — стиль CTA секции */}
        <div className="group relative rounded-3xl bg-gradient-to-br from-purple-500/20 via-card to-pink-500/20 p-[1px] hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 animate-fade-in-up">
          <div className="relative h-full rounded-3xl bg-card/95 backdrop-blur-xl p-10 md:p-12 overflow-hidden">

            {/* Точечный фон как в CTA */}
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                  backgroundSize: "32px 32px",
                }}
              />
            </div>

            {/* Shimmer */}
            <div className="absolute inset-0 animate-shimmer opacity-20" />

            <div className="relative z-10">

              {/* Бейдж */}
              <div className="flex justify-center mb-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-sm text-purple-300">Личный кабинет</span>
                </div>
              </div>

              {/* Название — шрифт как "Защитите тайное" */}
              <h1
                className="text-5xl font-bold text-center mb-3 animate-fade-in-up"
                style={{ animationDelay: "0.1s", fontFamily: "serif" }}
              >
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_40px_rgba(167,139,250,0.4)]">
                  Arcanum
                </span>
              </h1>

              <p
                className="text-center text-muted-foreground text-base mb-12 animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                Войдите в личный кабинет
              </p>

              {/* Кнопки */}
              <div
                className="space-y-4 animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >

                {/* Google */}
                <button
                  onClick={handleGoogleLogin}
                  onMouseEnter={() => setHoveredBtn("google")}
                  onMouseLeave={() => setHoveredBtn(null)}
                  className="relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-secondary/50 border border-border hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 backdrop-blur-sm overflow-hidden group"
                >
                  {/* Sparkles при наведении */}
                  {hoveredBtn === "google" &&
                    sparkles.map((sparkle) => (
                      <span
                        key={sparkle.id}
                        className="absolute w-1 h-1 bg-purple-400 rounded-full pointer-events-none animate-ping"
                        style={{
                          left: `${sparkle.x}%`,
                          top: `${sparkle.y}%`,
                        }}
                      />
                    ))}

                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 transition-colors relative z-10"
                    viewBox="0 0 24 24"
                  >
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors relative z-10 font-medium">
                    Войти через Google
                  </span>
                </button>

                {/* Разделитель */}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">или</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Telegram */}
                <a
                  href="https://t.me/arcanumvpnbot?start=login"
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setHoveredBtn("telegram")}
                  onMouseLeave={() => setHoveredBtn(null)}
                  className="relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-secondary/50 border border-border hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 backdrop-blur-sm overflow-hidden group"
                >
                  {/* Sparkles при наведении */}
                  {hoveredBtn === "telegram" &&
                    sparkles.map((sparkle) => (
                      <span
                        key={sparkle.id}
                        className="absolute w-1 h-1 bg-purple-400 rounded-full pointer-events-none animate-ping"
                        style={{
                          left: `${sparkle.x}%`,
                          top: `${sparkle.y}%`,
                        }}
                      />
                    ))}

                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 transition-colors relative z-10"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors relative z-10 font-medium">
                    Войти через Telegram
                  </span>
                </a>

              </div>

              {/* Мелкий текст */}
              <p
                className="text-center text-muted-foreground/50 text-xs leading-relaxed mt-15 animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                Мы не получаем доступ к вашим сообщениям и контактам
              </p>

            </div>
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
    </main>
  )
}