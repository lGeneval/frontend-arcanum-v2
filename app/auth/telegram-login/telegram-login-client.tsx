"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function TelegramLoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function autoLogin() {
      console.log("🚀 1. Auto-login started")
      
      const token = searchParams.get("token")
      console.log("🔑 2. Token from URL:", token)

      if (!token) {
        console.log("❌ No token found")
        router.replace("/login?error=no_token")
        return
      }

      try {
        // Проверяем токен
        console.log("🔍 3. Checking token in DB...")
        const { data: tokenData, error: tokenError } = await supabase
          .from("telegram_login_tokens")
          .select("*")
          .eq("token", token)
          .eq("used", false)
          .single()

        if (tokenError) {
          console.log("❌ 4. Token error:", tokenError)
          router.replace("/login?error=invalid_token")
          return
        }

        if (!tokenData) {
          console.log("❌ 5. Token not found in DB")
          router.replace("/login?error=token_not_found")
          return
        }

        console.log("✅ 6. Token found:", tokenData)

        // Проверяем срок действия
        if (new Date(tokenData.expires_at) < new Date()) {
          console.log("❌ 7. Token expired")
          router.replace("/login?error=token_expired")
          return
        }

        // Помечаем токен как использованный
        console.log("🔄 8. Marking token as used...")
        await supabase
          .from("telegram_login_tokens")
          .update({ used: true })
          .eq("token", token)

        // Получаем профиль пользователя
        console.log("👤 9. Fetching profile...")
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("telegram_id", tokenData.telegram_id)
          .single()

        if (!profile) {
          console.log("❌ 10. Profile not found")
          router.replace("/login?error=profile_not_found")
          return
        }

        console.log("✅ 11. Profile found:", profile)

        // Сохраняем в localStorage
        const userData = {
          id: profile.id,
          telegram_id: profile.telegram_id,
          first_name: profile.telegram_first_name,
          username: profile.telegram_username,
          photo_url: profile.telegram_photo_url,
          balance: profile.balance,
        }
        localStorage.setItem("arcanum_user", JSON.stringify(userData))
        console.log("💾 12. Saved to localStorage")

        // Редирект в dashboard
        console.log("🚀 13. Redirecting to dashboard...")
        router.replace("/dashboard")
      } catch (error) {
        console.error("💥 14. CRITICAL ERROR:", error)
        router.replace("/login?error=auth_failed")
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