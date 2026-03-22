"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function TelegramLoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function run() {
      const token = searchParams.get("token")
      if (!token) {
        router.replace("/login?error=no_token")
        return
      }

      try {
        const res = await fetch(`/api/auth/telegram/consume?token=${encodeURIComponent(token)}`)
        const json = await res.json()

        if (!json.success) {
          router.replace(`/login?error=${json.error || "auth_failed"}`)
          return
        }

        localStorage.setItem("arcanum_user", JSON.stringify(json.user))
        router.replace("/dashboard")
      } catch (e) {
        router.replace("/login?error=exception")
      }
    }

    run()
  }, [router, searchParams])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Авторизация через Telegram...</p>
      </div>
    </main>
  )
}