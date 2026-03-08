"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      setErrorMsg("Токен не найден в ссылке")
      return
    }

    validateToken(token)
  }, [searchParams])

  async function validateToken(token: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/telegram-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: "validate-token",
            token: token
          })
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Ошибка авторизации")
      }

      const { error } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      if (error) throw error

      setStatus("success")
      setTimeout(() => router.replace("/dashboard"), 1500)

    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err.message || "Что-то пошло не так")
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0a",
      color: "white",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center",
      padding: "40px"
    }}>
      {status === "loading" && (
        <div>
          <div style={{
            width: "48px",
            height: "48px",
            border: "4px solid #333",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }} />
          <p style={{ fontSize: "18px" }}>Авторизация...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {status === "success" && (
        <div>
          <p style={{ fontSize: "48px", marginBottom: "16px" }}>✅</p>
          <p style={{ fontSize: "22px", color: "#4ade80", fontWeight: "600" }}>
            Вы вошли!
          </p>
          <p style={{ color: "#888", marginTop: "8px" }}>
            Переход в личный кабинет...
          </p>
        </div>
      )}

      {status === "error" && (
        <div>
          <p style={{ fontSize: "48px", marginBottom: "16px" }}>❌</p>
          <p style={{ fontSize: "22px", color: "#f87171", fontWeight: "600" }}>
            Ошибка
          </p>
          <p style={{ color: "#888", marginTop: "8px", marginBottom: "24px" }}>
            {errorMsg}
          </p>
          <a
            href="/login"
            style={{
              padding: "12px 32px",
              background: "#3b82f6",
              color: "white",
              borderRadius: "10px",
              textDecoration: "none"
            }}
          >
            Попробовать снова
          </a>
        </div>
      )}
    </div>
  )
}