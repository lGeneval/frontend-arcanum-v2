"use client"

import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { StarrySky } from "@/components/starry-sky"
import { MagicButton } from "@/components/magic-button"

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

  useEffect(() => {
    // Частицы как на главной
    const newParticles: MagicParticle[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      hue: Math.random() * 60 + 260,
    }))
    setParticles(newParticles)

    const user = localStorage.getItem("arcanum_user")
    if (user) {
      router.replace("/dashboard")
    } else {
      setIsLoading(false)
    }
  }, [router])

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

      {/* Частицы */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px] animate-pulse-glow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-pink-600/8 rounded-full blur-[80px]"
          style={{ animation: "pulse-glow 4s ease-in-out infinite", animationDelay: "1s" }}
        />
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, hsla(${p.hue}, 70%, 70%, 0.6) 0%, transparent 70%)`,
              animation: `mystical-float ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">

        {/* Назад */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 transition-all duration-300 mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">На главную</span>
        </Link>

        {/* Карточка */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl p-10 animate-fade-in-up">

          {/* Градиентное свечение карточки */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/[0.08] via-transparent to-pink-500/[0.08]" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-[80px]" />

          <div className="relative z-10">

            {/* Название */}
            <h1 className="text-center mb-3">
              <span
                className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-300 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]"
                style={{ fontFamily: "serif" }}
              >
                Arcanum
              </span>
            </h1>

            <p className="text-center text-white/30 text-sm mb-12">
              Войдите в личный кабинет
            </p>

            {/* Кнопки с MagicButton */}
            <div className="space-y-4">

              {/* Google с частицами */}
              <MagicButton
                onClick={handleGoogleLogin}
                className="w-full py-4 px-6 bg-white hover:bg-gray-100 text-gray-900 font-medium text-base rounded-2xl transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Войти через Google</span>
                </div>
              </MagicButton>

              {/* Разделитель */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/20">или</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Telegram с частицами */}
              <MagicButton
                className="w-full py-4 px-6 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-medium text-base rounded-2xl transition-all duration-300 hover:shadow-lg"
              >
                <a
                  href="https://t.me/arcanumvpnbot?start=login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  <span>Войти через Telegram</span>
                </a>
              </MagicButton>

            </div>

            {/* Мелкий текст */}
            <p className="text-center text-white/15 text-xs leading-relaxed mt-10">
              Мы не получаем доступ к вашим сообщениям и контактам
            </p>

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes mystical-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translate(20px, -30px) scale(1.3);
            opacity: 0.6;
          }
          66% {
            transform: translate(-15px, -50px) scale(0.7);
            opacity: 0.4;
          }
        }
      `}</style>
    </main>
  )
}