"use client"

import { useEffect, useState, useRef } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { StarrySky } from "@/components/starry-sky"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  hue: number
  velocityX: number
  velocityY: number
  life: number
}

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  const [googleParticles, setGoogleParticles] = useState<Particle[]>([])
  const [telegramParticles, setTelegramParticles] = useState<Particle[]>([])
  const [isGoogleHovered, setIsGoogleHovered] = useState(false)
  const [isTelegramHovered, setIsTelegramHovered] = useState(false)

  const googleRef = useRef<HTMLButtonElement>(null)
  const telegramRef = useRef<HTMLAnchorElement>(null)
  const googleAnimRef = useRef<number | null>(null)
  const telegramAnimRef = useRef<number | null>(null)

  useEffect(() => {
    async function checkAuth() {
      // 1. Проверяем Supabase сессию
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Сохраняем в localStorage для быстрой проверки на главной
        const userData = {
          id: session.user.id,
          first_name:
            session.user.user_metadata?.full_name?.split(" ")[0] ||
            "Пользователь",
          username: session.user.email || "",
          balance: 0,
        }
        localStorage.setItem("arcanum_user", JSON.stringify(userData))
        router.replace("/dashboard")
        return
      }

      // 2. Фолбэк на localStorage
      const localUser = localStorage.getItem("arcanum_user")
      if (localUser) {
        router.replace("/dashboard")
        return
      }

      setIsLoading(false)
    }

    checkAuth()

    // Слушаем OAuth callback (если пользователь вернулся после Google)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const userData = {
          id: session.user.id,
          first_name:
            session.user.user_metadata?.full_name?.split(" ")[0] ||
            "Пользователь",
          username: session.user.email || "",
          balance: 0,
        }
        localStorage.setItem("arcanum_user", JSON.stringify(userData))
        router.replace("/dashboard")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Анимация частиц для Google кнопки
  useEffect(() => {
    if (!isGoogleHovered || !googleRef.current) {
      setGoogleParticles([])
      if (googleAnimRef.current) cancelAnimationFrame(googleAnimRef.current)
      return
    }

    const rect = googleRef.current.getBoundingClientRect()
    let lastSpawn = 0

    const animate = (time: number) => {
      if (time - lastSpawn > 100) {
        lastSpawn = time
        const newParticle: Particle = {
          id: Date.now() + Math.random(),
          x: Math.random() * (rect.width + 40) - 20,
          y: Math.random() * (rect.height + 40) - 20,
          size: Math.random() * 4 + 2,
          hue: Math.random() * 60 + 260,
          velocityX: (Math.random() - 0.5) * 2,
          velocityY: (Math.random() - 0.5) * 2,
          life: 1,
        }
        setGoogleParticles((prev) => {
          const updated = prev
            .map((p) => ({
              ...p,
              x: p.x + p.velocityX,
              y: p.y + p.velocityY,
              life: p.life - 0.02,
            }))
            .filter((p) => p.life > 0)
          return [...updated, newParticle].slice(-20)
        })
      } else {
        setGoogleParticles((prev) =>
          prev
            .map((p) => ({
              ...p,
              x: p.x + p.velocityX,
              y: p.y + p.velocityY,
              velocityX: p.velocityX + (Math.random() - 0.5) * 0.3,
              velocityY: p.velocityY + (Math.random() - 0.5) * 0.3,
              life: p.life - 0.008,
            }))
            .filter((p) => p.life > 0)
        )
      }
      googleAnimRef.current = requestAnimationFrame(animate)
    }
    googleAnimRef.current = requestAnimationFrame(animate)
    return () => {
      if (googleAnimRef.current) cancelAnimationFrame(googleAnimRef.current)
    }
  }, [isGoogleHovered])

  // Анимация частиц для Telegram кнопки
  useEffect(() => {
    if (!isTelegramHovered || !telegramRef.current) {
      setTelegramParticles([])
      if (telegramAnimRef.current)
        cancelAnimationFrame(telegramAnimRef.current)
      return
    }

    const rect = telegramRef.current.getBoundingClientRect()
    let lastSpawn = 0

    const animate = (time: number) => {
      if (time - lastSpawn > 100) {
        lastSpawn = time
        const newParticle: Particle = {
          id: Date.now() + Math.random(),
          x: Math.random() * (rect.width + 40) - 20,
          y: Math.random() * (rect.height + 40) - 20,
          size: Math.random() * 4 + 2,
          hue: Math.random() * 40 + 190,
          velocityX: (Math.random() - 0.5) * 2,
          velocityY: (Math.random() - 0.5) * 2,
          life: 1,
        }
        setTelegramParticles((prev) => {
          const updated = prev
            .map((p) => ({
              ...p,
              x: p.x + p.velocityX,
              y: p.y + p.velocityY,
              life: p.life - 0.02,
            }))
            .filter((p) => p.life > 0)
          return [...updated, newParticle].slice(-20)
        })
      } else {
        setTelegramParticles((prev) =>
          prev
            .map((p) => ({
              ...p,
              x: p.x + p.velocityX,
              y: p.y + p.velocityY,
              velocityX: p.velocityX + (Math.random() - 0.5) * 0.3,
              velocityY: p.velocityY + (Math.random() - 0.5) * 0.3,
              life: p.life - 0.008,
            }))
            .filter((p) => p.life > 0)
        )
      }
      telegramAnimRef.current = requestAnimationFrame(animate)
    }
    telegramAnimRef.current = requestAnimationFrame(animate)
    return () => {
      if (telegramAnimRef.current)
        cancelAnimationFrame(telegramAnimRef.current)
    }
  }, [isTelegramHovered])

  const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
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
      <StarrySky />

      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">На главную</span>
        </Link>

        <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-card/50 backdrop-blur-xl p-10 animate-fade-in-up">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-[80px]" />

          <div className="relative z-10">
            <h1 className="text-center mb-3">
              <span
                className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]"
                style={{ fontFamily: "serif" }}
              >
                Arcanum
              </span>
            </h1>

            <p className="text-center text-muted-foreground text-sm mb-12">
              Войдите в личный кабинет
            </p>

            <div className="space-y-4">
              {/* Google */}
              <div className="relative">
                <button
                  ref={googleRef}
                  onClick={handleGoogleLogin}
                  onMouseEnter={() => setIsGoogleHovered(true)}
                  onMouseLeave={() => setIsGoogleHovered(false)}
                  className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-purple-500/20 bg-card/50 transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-purple-500/10 hover:border-purple-500/40 ${
                    isGoogleHovered
                      ? "scale-[1.02] shadow-lg shadow-purple-500/20"
                      : ""
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-medium">Войти через Google</span>
                </button>

                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  {googleParticles.map((p) => (
                    <div
                      key={p.id}
                      className="absolute rounded-full"
                      style={{
                        left: p.x,
                        top: p.y,
                        width: p.size,
                        height: p.size,
                        opacity: p.life,
                        background: `radial-gradient(circle, hsla(${p.hue}, 80%, 70%, 0.9) 0%, hsla(${p.hue}, 70%, 50%, 0.5) 50%, transparent 70%)`,
                        boxShadow: `0 0 ${p.size * 2}px hsla(${p.hue}, 80%, 60%, ${p.life * 0.5})`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Разделитель */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-purple-500/20" />
                <span className="text-xs text-muted-foreground">или</span>
                <div className="flex-1 h-px bg-purple-500/20" />
              </div>

              {/* Telegram */}
              <div className="relative">
                <a
                  ref={telegramRef}
                  href="https://t.me/arcanumvpnbot?start=login"
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setIsTelegramHovered(true)}
                  onMouseLeave={() => setIsTelegramHovered(false)}
                  className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-purple-500/20 bg-card/50 transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-purple-500/10 hover:border-purple-500/40 ${
                    isTelegramHovered
                      ? "scale-[1.02] shadow-lg shadow-purple-500/20"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  <span className="font-medium">Войти через Telegram</span>
                </a>

                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  {telegramParticles.map((p) => (
                    <div
                      key={p.id}
                      className="absolute rounded-full"
                      style={{
                        left: p.x,
                        top: p.y,
                        width: p.size,
                        height: p.size,
                        opacity: p.life,
                        background: `radial-gradient(circle, hsla(${p.hue}, 80%, 70%, 0.9) 0%, hsla(${p.hue}, 70%, 50%, 0.5) 50%, transparent 70%)`,
                        boxShadow: `0 0 ${p.size * 2}px hsla(${p.hue}, 80%, 60%, ${p.life * 0.5})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-center text-muted-foreground/50 text-xs leading-relaxed mt-10">
              Мы не получаем доступ к вашим сообщениям и контактам
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}