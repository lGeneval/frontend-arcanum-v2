"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [subscriptions, setSubs] = useState<any[]>([])
  const [vpnKeys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initAuth()
  }, [])

  async function initAuth() {
    // ✅ ИСПРАВЛЕНИЕ: Именно это уберет бесконечный редирект
    // Сначала проверяем localStorage, потом уже Supabase

    const localUser = localStorage.getItem('arcanum_user')

    if (localUser) {
      const user = JSON.parse(localUser)

      // Пробуем загрузить реальные данные из Supabase
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        await loadFromDB(session.user.id)
      } else {
        // Тестовый режим
        setProfile({
          telegram_first_name: user.first_name,
          telegram_username: user.username,
          telegram_id: user.id,
          balance: 0
        })
      }

      setLoading(false)
      return
    }

    // Если вообще ничего нет — на логин
    router.replace("/login")
  }

  async function loadFromDB(userId: string) {
    const [profileRes, subsRes, keysRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("subscriptions").select("*").eq("user_id", userId),
      supabase.from("vpn_keys").select("*").eq("user_id", userId).eq("is_active", true),
    ])

    if (profileRes.data) setProfile(profileRes.data)
    if (subsRes.data) setSubs(subsRes.data)
    if (keysRes.data) setKeys(keysRes.data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    localStorage.removeItem('arcanum_user')
    router.replace("/login")
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        color: "white"
      }}>
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "white",
      padding: "24px",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px"
        }}>
          <h1 style={{ fontSize: "24px" }}>
            👋 {profile?.telegram_first_name || "Пользователь"}
          </h1>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 20px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Выйти
          </button>
        </div>

        <div style={{
          background: "#111",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "20px"
        }}>
          <h2 style={{ marginBottom: "12px" }}>👤 Профиль</h2>
          <p style={{ color: "#888" }}>
            Telegram: @{profile?.telegram_username || "не указан"}
          </p>
          <p style={{ color: "#888" }}>
            ID: {profile?.telegram_id}
          </p>
        </div>

        <div style={{
          background: "#111",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "20px"
        }}>
          <h2 style={{ marginBottom: "12px" }}>📊 Подписка</h2>
          {subscriptions.length > 0 ? (
            subscriptions.map((sub) => (
              <div key={sub.id} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0"
              }}>
                <div>
                  <p style={{ fontWeight: "600" }}>{sub.plan_name}</p>
                  <p style={{ color: "#888", fontSize: "14px" }}>
                    до {new Date(sub.expires_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  background: sub.status === "active" ? "#064e3b" : "#7f1d1d",
                  color: sub.status === "active" ? "#34d399" : "#fca5a5"
                }}>
                  {sub.status === "active" ? "Активна" : "Истекла"}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: "#666" }}>Нет активных подписок</p>
          )}
        </div>

        <div style={{
          background: "#111",
          borderRadius: "16px",
          padding: "24px"
        }}>
          <h2 style={{ marginBottom: "12px" }}>🔑 VPN-ключи</h2>
          {vpnKeys.length > 0 ? (
            vpnKeys.map((key) => (
              <div key={key.id} style={{
                background: "#1a1a1a",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <p style={{ fontWeight: "600" }}>{key.key_name}</p>
                  <p style={{ color: "#888", fontSize: "13px" }}>
                    {key.server_location} • {key.protocol}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(key.access_url)
                    alert("Ключ скопирован!")
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  Копировать
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: "#666" }}>Нет активных ключей</p>
          )}
        </div>

      </div>
    </div>
  )
}