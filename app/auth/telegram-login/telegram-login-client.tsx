"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

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
        // Проверяем токен
        const { data: tokenData, error: tokenError } = await supabase
          .from("telegram_login_tokens")
          .select("*")
          .eq("token", token)
          .eq("used", false)
          .single()

        if (tokenError || !tokenData) {
          router.replace("/login?error=invalid_token")
          return
        }

        // Проверяем срок действия
        if (new Date(tokenData.expires_at) < new Date()) {
          router.replace("/login?error=token_expired")
          return
        }

        // Помечаем токен как использованный
        await supabase
          .from("telegram_login_tokens")
          .update({ used: true })
          .eq("token", token)

        // Получаем профиль пользователя
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("telegram_id", tokenData.telegram_id)
          .single()

        if (!profile) {
          router.replace("/login?error=profile_not_found")
          return
        }

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

        // Редирект в dashboard
        router.replace("/dashboard")
      } catch (error) {
        console.error("Auto-login error:", error)
        router.replace("/login?error=auth_failed")
      }
    }

    autoLogin()
  }, [router, searchParams])

  return null
}