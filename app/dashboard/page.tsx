"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { StarrySky } from "@/components/starry-sky"
import { MagicButton } from "@/components/magic-button"
import {
  Shield, LogOut, Key, CreditCard, Users, Copy, Check,
  Plus, Smartphone, Monitor, Laptop, X, Wallet, Gift,
  Globe, Zap, Sparkles, ChevronRight, Home,
} from "lucide-react"

export const dynamic = "force-dynamic"

type Tab = "overview" | "keys" | "plans" | "referral"

interface MagicParticle {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
  hue: number
}

const PLANS = [
  { id: "1month", name: "Стартовый", months: 1, price: 149, pricePerMonth: 149, discount: 0, popular: false, gradient: "from-blue-500 to-indigo-600" },
  { id: "3months", name: "Оптимальный", months: 3, price: 399, pricePerMonth: 133, discount: 11, popular: true, gradient: "from-purple-500 to-pink-600" },
  { id: "12months", name: "Годовой", months: 12, price: 999, pricePerMonth: 83, discount: 44, popular: false, gradient: "from-emerald-500 to-teal-500" },
]

const DEVICE_TYPES = [
  { id: "ios", name: "iPhone / iPad", icon: Smartphone },
  { id: "android", name: "Android", icon: Smartphone },
  { id: "windows", name: "Windows", icon: Monitor },
  { id: "macos", name: "macOS", icon: Laptop },
]

const STAT_CARDS = [
  { icon: Wallet, label: "Баланс", key: "balance", sub: "Пополнить", tab: null, gradient: "from-purple-500 to-pink-600" },
  { icon: Zap, label: "Подписка", key: "sub", sub: "Подключить", tab: "plans", gradient: "from-blue-500 to-indigo-600" },
  { icon: Key, label: "Устройства", key: "keys", sub: "Управлять", tab: "keys", gradient: "from-emerald-500 to-teal-500" },
  { icon: Gift, label: "Рефералы", key: "ref", sub: "Бонус за друга", tab: "referral", gradient: "from-orange-500 to-amber-500" },
]

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [subscriptions, setSubs] = useState<any[]>([])
  const [vpnKeys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [particles, setParticles] = useState<MagicParticle[]>([])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [copiedRef, setCopiedRef] = useState(false)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState("")

  useEffect(() => {
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
    initAuth()
  }, [])

  async function initAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await loadFromDB(session.user.id)
      const userData = {
        id: session.user.id,
        first_name: session.user.user_metadata?.full_name?.split(" ")[0] || "Пользователь",
        username: session.user.email || "",
        balance: 0,
      }
      localStorage.setItem("arcanum_user", JSON.stringify(userData))
      setLoading(false)
      return
    }
    const localUser = localStorage.getItem("arcanum_user")
    if (localUser) {
      const user = JSON.parse(localUser)
      setProfile({
        telegram_first_name: user.first_name,
        telegram_username: user.username,
        telegram_id: user.id,
        balance: 0,
        referral_code: "ARC" + Math.random().toString(36).substring(2, 6).toUpperCase(),
      })
      setLoading(false)
      return
    }
    router.replace("/login")
  }

  async function loadFromDB(userId: string) {
    try {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single()
      if (profileData) {
        setProfile(profileData)
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        const { data: newProfile } = await supabase.from("profiles").insert({
          id: userId,
          email: user?.email,
          google_id: user?.user_metadata?.provider_id,
          telegram_first_name: user?.user_metadata?.full_name?.split(" ")[0] || "Пользователь",
          balance: 0,
        }).select().single()
        if (newProfile) setProfile(newProfile)
      }
      const [subsRes, keysRes] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", userId),
        supabase.from("vpn_keys").select("*").eq("user_id", userId).eq("is_active", true),
      ])
      if (subsRes.data) setSubs(subsRes.data)
      if (keysRes.data) setKeys(keysRes.data)
    } catch (err) {
      console.error("DB error:", err)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    localStorage.removeItem("arcanum_user")
    router.replace("/login")
  }

  function copyToClipboard(text: string, keyId?: string) {
    navigator.clipboard.writeText(text)
    if (keyId) {
      setCopiedKey(keyId)
      setTimeout(() => setCopiedKey(null), 2000)
    } else {
      setCopiedRef(true)
      setTimeout(() => setCopiedRef(false), 2000)
    }
  }

  function handleAddDevice(deviceType: string) {
    const names: Record<string, string> = { ios: "iPhone", android: "Android", windows: "Windows PC", macos: "MacBook" }
    const newKey = {
      id: "key_" + Date.now(),
      key_name: names[deviceType] || "Устройство",
      device_type: deviceType,
      access_url: `vless://demo-key-${Date.now()}@vpn.arcanumnox.net:443`,
      server_location: "Финляндия",
      protocol: "VLESS",
      is_active: true,
    }
    setKeys((prev) => [...prev, newKey])
    setShowAddDevice(false)
  }

  const activeSub = subscriptions.find((s) => s.status === "active")

  const getStatValue = (key: string) => {
    if (key === "balance") return `${profile?.balance || 0} ₽`
    if (key === "sub") return activeSub ? "Активна" : "Нет"
    if (key === "keys") return `${vpnKeys.length} / 5`
    if (key === "ref") return "20%"
    return ""
  }

  const getStatSub = (key: string, defaultSub: string) => {
    if (key === "sub" && activeSub) return `до ${new Date(activeSub.expires_at).toLocaleDateString("ru-RU")}`
    return defaultSub
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </main>
    )
  }

  const tabs = [
    { id: "overview" as Tab, label: "Обзор", icon: Home },
    { id: "keys" as Tab, label: "Устройства", icon: Key },
    { id: "plans" as Tab, label: "Тарифы", icon: CreditCard },
    { id: "referral" as Tab, label: "Рефералы", icon: Users },
  ]

  return (
    <main className="min-h-screen relative overflow-hidden bg-background pb-24 md:pb-0">

      <StarrySky />

      {/* Частицы */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-pink-600/8 rounded-full blur-[80px]"
          style={{ animation: "pulse-glow 4s ease-in-out infinite", animationDelay: "1s" }} />
        {particles.map((p) => (
          <div key={p.id} className="absolute rounded-full"
            style={{
              left: `${p.left}%`, top: `${p.top}%`,
              width: p.size, height: p.size,
              background: `radial-gradient(circle, hsla(${p.hue}, 70%, 70%, 0.6) 0%, transparent 70%)`,
              animation: `mystical-float ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }} />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.06] bg-background/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-400 animate-magic-glow" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Arcanum
            </span>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
                style={{ fontFamily: "'Georgia', serif" }}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Georgia', serif" }}>
                {profile?.telegram_first_name || profile?.email?.split("@")[0] || "Пользователь"}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.telegram_username ? `@${profile.telegram_username}` : profile?.email || ""}
              </p>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group">
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline text-sm" style={{ fontFamily: "'Georgia', serif" }}>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ===== ОБЗОР ===== */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300" style={{ fontFamily: "'Georgia', serif" }}>Личный кабинет</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                  Привет, {profile?.telegram_first_name || profile?.email?.split("@")[0] || "Пользователь"}!
                </span>
              </h1>
            </div>

            {/* Stat Cards — стиль features секции */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {STAT_CARDS.map((card) => (
                <button
                  key={card.label}
                  onClick={() => card.tab ? setActiveTab(card.tab as Tab) : setShowTopUp(true)}
                  className="group relative rounded-2xl bg-card border border-purple-500/10 p-5 text-left hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 overflow-hidden"
                >
                  {/* Hover glow — как в features */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>

                  <p className="text-xl font-bold text-foreground mb-1 group-hover:text-purple-300 transition-colors"
                    style={{ fontFamily: "'Georgia', serif" }}>
                    {getStatValue(card.key)}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Georgia', serif" }}>
                    {card.label} · {getStatSub(card.key, card.sub)}
                  </p>

                  {/* Corner accent — как в features */}
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
                </button>
              ))}
            </div>

            {/* Quick Start */}
            <div className="group relative rounded-2xl bg-card border border-purple-500/10 p-6 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />

              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 group-hover:text-purple-300 transition-colors"
                style={{ fontFamily: "'Georgia', serif" }}>
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                Быстрый старт
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { step: "1", title: "Выберите тариф", desc: "Пополните баланс и активируйте подписку" },
                  { step: "2", title: "Добавьте устройство", desc: "iOS, Android, Windows или macOS" },
                  { step: "3", title: "Подключитесь", desc: "Скопируйте ключ и вставьте в приложение" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Georgia', serif" }}>{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keys Preview */}
            {vpnKeys.length > 0 && (
              <div className="group relative rounded-2xl bg-card border border-purple-500/10 p-6 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 group-hover:text-purple-300 transition-colors"
                    style={{ fontFamily: "'Georgia', serif" }}>
                    <Key className="w-5 h-5 text-blue-400" />
                    Ваши устройства
                  </h3>
                  <button onClick={() => setActiveTab("keys")}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                    style={{ fontFamily: "'Georgia', serif" }}>
                    Все <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {vpnKeys.slice(0, 3).map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/20 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        {key.device_type === "ios" || key.device_type === "android" ? <Smartphone className="w-4 h-4 text-muted-foreground" /> : key.device_type === "macos" ? <Laptop className="w-4 h-4 text-muted-foreground" /> : <Monitor className="w-4 h-4 text-muted-foreground" />}
                        <div>
                          <p className="text-sm font-medium" style={{ fontFamily: "'Georgia', serif" }}>{key.key_name}</p>
                          <p className="text-xs text-muted-foreground">{key.server_location} · {key.protocol}</p>
                        </div>
                      </div>
                      <button onClick={() => copyToClipboard(key.access_url, key.id)} className="p-2 rounded-lg hover:bg-purple-500/10 transition-colors">
                        {copiedKey === key.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== УСТРОЙСТВА ===== */}
        {activeTab === "keys" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Georgia', serif" }}>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                  Устройства
                </span>
              </h2>
              {vpnKeys.length < 5 && (
                <MagicButton
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border border-purple-400/30"
                  onClick={() => setShowAddDevice(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </MagicButton>
              )}
            </div>

            {vpnKeys.length === 0 ? (
              <div className="group relative rounded-2xl bg-card border border-purple-500/10 p-16 text-center hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                <Key className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-30" />
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Georgia', serif" }}>Нет подключённых устройств</h3>
                <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">Добавьте устройство и получите VPN-ключ для подключения</p>
                <MagicButton
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 border border-purple-400/30"
                  onClick={() => setShowAddDevice(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить устройство
                </MagicButton>
              </div>
            ) : (
              <div className="space-y-3">
                {vpnKeys.map((key) => (
                  <div key={key.id}
                    className="group relative rounded-2xl bg-card border border-purple-500/10 p-5 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 overflow-hidden">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg">
                          {key.device_type === "ios" || key.device_type === "android" ? <Smartphone className="w-5 h-5 text-white" /> : key.device_type === "macos" ? <Laptop className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold group-hover:text-purple-300 transition-colors" style={{ fontFamily: "'Georgia', serif" }}>{key.key_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Globe className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{key.server_location} · {key.protocol}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">Активен</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-muted-foreground bg-background/50 rounded-xl px-3 py-2 font-mono truncate border border-white/[0.04]">
                        {key.access_url}
                      </code>
                      <button
                        onClick={() => copyToClipboard(key.access_url, key.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${copiedKey === key.id ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-purple-500/20 text-purple-300 border border-purple-500/20 hover:bg-purple-500/30"}`}
                        style={{ fontFamily: "'Georgia', serif" }}
                      >
                        {copiedKey === key.id ? <><Check className="w-4 h-4" />Скопировано</> : <><Copy className="w-4 h-4" />Копировать</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ТАРИФЫ ===== */}
        {activeTab === "plans" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300" style={{ fontFamily: "'Georgia', serif" }}>Выберите тариф</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Georgia', serif" }}>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                  Тарифные планы
                </span>
              </h2>
              <p className="text-muted-foreground mt-2">Один аккаунт — до 5 устройств</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {PLANS.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`group relative rounded-2xl bg-card border border-purple-500/10 p-7 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 overflow-hidden flex flex-col ${plan.popular ? "border-purple-500/30 shadow-lg shadow-purple-500/10 scale-[1.02]" : ""}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Hover glow */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  {/* Corner accent */}
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />

                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-500/30"
                      style={{ fontFamily: "'Georgia', serif" }}>
                      ⭐ Популярный
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col flex-1">
                    {/* Иконка */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg`}>
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="text-xl font-bold mb-1 group-hover:text-purple-300 transition-colors"
                      style={{ fontFamily: "'Georgia', serif" }}>{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.months === 1 ? "1 месяц" : plan.months === 3 ? "3 месяца" : "12 месяцев"}
                    </p>

                    <div className="mb-1">
                      <span className="text-4xl font-bold" style={{ fontFamily: "'Georgia', serif" }}>{plan.price}</span>
                      <span className="text-muted-foreground ml-1">₽</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{plan.pricePerMonth} ₽/мес</p>

                    {plan.discount > 0 && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20 mb-4 w-fit">
                        Скидка {plan.discount}%
                      </span>
                    )}

                    <div className="mt-auto space-y-3">
                      <div className="pt-4 border-t border-white/[0.06] space-y-2">
                        {["До 5 устройств", "Все серверы", "Безлимитный трафик", "Поддержка 24/7"].map((f) => (
                          <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>

                      <MagicButton
                        className={`w-full ${plan.popular
                          ? "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 border border-purple-400/30"
                          : "border-purple-500/30 hover:bg-purple-500/10"}`}
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => setShowTopUp(true)}
                      >
                        {(profile?.balance || 0) >= plan.price ? "Подключить" : "Пополнить"}
                      </MagicButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trial */}
            <div className="group relative rounded-2xl bg-card border border-yellow-500/20 p-8 text-center hover:border-yellow-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-yellow-300 transition-colors"
                style={{ fontFamily: "'Georgia', serif" }}>15 дней бесплатно</h3>
              <p className="text-muted-foreground text-sm mb-6">Попробуйте Arcanum VPN без оплаты. Без привязки карты.</p>
              <MagicButton variant="outline" className="border-yellow-500/30 hover:bg-yellow-500/10 hover:border-yellow-400/50">
                Активировать пробный период
              </MagicButton>
            </div>
          </div>
        )}

        {/* ===== РЕФЕРАЛЫ ===== */}
        {activeTab === "referral" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300" style={{ fontFamily: "'Georgia', serif" }}>Зарабатывайте вместе</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Georgia', serif" }}>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                  Реферальная программа
                </span>
              </h2>
              <p className="text-muted-foreground mt-2">Приглашайте друзей и получайте 20% от их платежей</p>
            </div>

            {/* Ref Link */}
            <div className="group relative rounded-2xl bg-card border border-purple-500/10 p-6 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
              <h3 className="text-sm font-medium text-muted-foreground mb-3 group-hover:text-purple-300 transition-colors"
                style={{ fontFamily: "'Georgia', serif" }}>
                Ваша реферальная ссылка
              </h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <code className="flex-1 text-sm bg-background/50 rounded-xl px-4 py-3 font-mono text-purple-300 border border-purple-500/10 truncate">
                  https://arcanumnox.net/ref/{profile?.referral_code || "XXXXXXXX"}
                </code>
                <MagicButton
                  className={copiedRef
                    ? "bg-green-500/20 text-green-400 border border-green-500/20"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border border-purple-400/30"}
                  onClick={() => copyToClipboard(`https://arcanumnox.net/ref/${profile?.referral_code}`)}
                >
                  {copiedRef ? <><Check className="w-4 h-4 mr-2" />Скопировано</> : <><Copy className="w-4 h-4 mr-2" />Копировать</>}
                </MagicButton>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Users, label: "Приглашено", value: "0", gradient: "from-blue-500 to-indigo-600" },
                { icon: Wallet, label: "Заработано", value: "0 ₽", gradient: "from-purple-500 to-pink-600" },
                { icon: Gift, label: "Бонус", value: "20%", gradient: "from-emerald-500 to-teal-500" },
              ].map((stat, index) => (
                <div key={stat.label}
                  className="group relative rounded-2xl bg-card border border-purple-500/10 p-6 text-center hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold mb-1 group-hover:text-purple-300 transition-colors"
                    style={{ fontFamily: "'Georgia', serif" }}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="group relative rounded-2xl bg-card border border-purple-500/10 p-6 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 group-hover:text-purple-300 transition-colors"
                style={{ fontFamily: "'Georgia', serif" }}>
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                Как это работает
              </h3>
              <div className="space-y-5">
                {[
                  { step: "1", title: "Поделитесь ссылкой", desc: "Отправьте реферальную ссылку друзьям" },
                  { step: "2", title: "Друг регистрируется", desc: "И покупает любой тариф Arcanum VPN" },
                  { step: "3", title: "Получите бонус", desc: "20% от каждого платежа друга — навсегда" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground" style={{ fontFamily: "'Georgia', serif" }}>{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== МОБИЛЬНАЯ НАВИГАЦИЯ (нижняя панель) ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-background/80 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === tab.id ? "scale-110" : ""}`} />
              <span className="text-[10px] font-medium" style={{ fontFamily: "'Georgia', serif" }}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Модалка: Добавить устройство */}
      {showAddDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-purple-500/20 shadow-2xl shadow-purple-500/20 animate-scale-in overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-[0.03]" />
            <div className="relative p-7">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ fontFamily: "'Georgia', serif" }}>Добавить устройство</h3>
                <button onClick={() => setShowAddDevice(false)} className="p-2 rounded-xl hover:bg-purple-500/10 transition-colors text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {DEVICE_TYPES.map((device) => (
                  <button key={device.id} onClick={() => handleAddDevice(device.id)}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-purple-500/10 bg-card hover:bg-purple-500/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                    <device.icon className="w-8 h-8 text-muted-foreground group-hover:text-purple-400 transition-colors duration-300 group-hover:scale-110 transform relative z-10" />
                    <span className="text-sm font-medium relative z-10" style={{ fontFamily: "'Georgia', serif" }}>{device.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка: Пополнение */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-purple-500/20 shadow-2xl shadow-purple-500/20 animate-scale-in overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-[0.03]" />
            <div className="relative p-7">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ fontFamily: "'Georgia', serif" }}>Пополнить баланс</h3>
                <button onClick={() => setShowTopUp(false)} className="p-2 rounded-xl hover:bg-purple-500/10 transition-colors text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block" style={{ fontFamily: "'Georgia', serif" }}>Сумма (₽)</label>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Введите сумму"
                    className="w-full px-4 py-3 rounded-xl bg-background/50 border border-purple-500/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[149, 399, 999].map((amount) => (
                    <button key={amount} onClick={() => setTopUpAmount(String(amount))}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${topUpAmount === String(amount) ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25" : "bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20"}`}
                      style={{ fontFamily: "'Georgia', serif" }}>
                      {amount} ₽
                    </button>
                  ))}
                </div>
                <MagicButton
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 border border-purple-400/30"
                  onClick={() => { alert("Оплата через Lava.ru — будет подключена скоро!"); setShowTopUp(false) }}
                >
                  Оплатить {topUpAmount ? `${topUpAmount} ₽` : ""}
                </MagicButton>
                <p className="text-xs text-center text-muted-foreground">
                  Оплата через Lava.ru · Карты, СБП, криптовалюта
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes mystical-float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          33% { transform: translate(20px, -30px) scale(1.3); opacity: 0.6; }
          66% { transform: translate(-15px, -50px) scale(0.7); opacity: 0.4; }
        }
      `}</style>
    </main>
  )
}