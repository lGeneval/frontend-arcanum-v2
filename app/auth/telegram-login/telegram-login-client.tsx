"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function TelegramLoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function autoLogin() {
      const token = searchParams.get("token")

      if (!token) {
        router.replace("/login?error=no_token")
        return
      }

      try {
        // 🔥 ОБРАЩАЕМСЯ К НАШЕМУ НОВОМУ API 🔥
        const res = await fetch(`/api/auth/telegram/consume?token=${token}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Auth failed")
        }

        // Сохраняем в localStorage
        localStorage.setItem("arcanum_user", JSON.stringify(data.user))

        // Редирект в dashboard
        router.replace("/dashboard")
      } catch (error: any) {
        console.error("Auto-login error:", error)
        router.replace(`/login?error=${error.message}`)
      }
    }

    autoLogin()
  }, [router, searchParams])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Авторизация...</p>
      </div>
    </main>
  )
}