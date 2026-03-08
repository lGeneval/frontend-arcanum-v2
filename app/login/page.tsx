"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard")
      }
    })
  }, [router])

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0a",
      color: "white",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{
        maxWidth: "400px",
        width: "100%",
        padding: "40px",
        textAlign: "center"
      }}>
        <h1 style={{ fontSize: "28px", marginBottom: "16px" }}>
          🔐 Вход в VPN-кабинет
        </h1>

        <p style={{ color: "#888", marginBottom: "32px", lineHeight: "1.6" }}>
          Авторизация через Telegram-бота.
          <br />
          Быстро, безопасно, без паролей.
        </p>

        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            padding: "16px 24px",
            background: "#2AABEE",
            color: "white",
            borderRadius: "12px",
            textDecoration: "none",
            fontSize: "18px",
            fontWeight: "600"
          }}
        >
          📱 Войти через Telegram
        </a>

        <p style={{
          color: "#555",
          marginTop: "24px",
          fontSize: "14px",
          lineHeight: "1.6"
        }}>
          Нажмите кнопку, откройте бота и нажмите
          <br />
          «Личный кабинет» — вы попадёте на сайт автоматически
        </p>
      </div>
    </div>
  )
}