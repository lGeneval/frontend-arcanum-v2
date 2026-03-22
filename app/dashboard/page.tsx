"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { StarrySky } from "@/components/starry-sky"
import {
  Sparkles,
  LogOut,
  Plus,
  Copy,
  Check,
  X,
  Shield,
  CreditCard,
  Key,
  Users,
  ArrowRight,
  Smartphone,
  Monitor,
  Laptop,
  Globe,
  Wallet,
  Gift,
  Zap,
  ChevronRight,
} from "lucide-react"

interface MagicParticle {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
  hue: number
}

interface VpnKey {
  id: string
  key_name: string
  device_type: string
  access_url: string
  server_location: string
  protocol: string
  is_active: boolean
  created_at: string
}

interface Subscription {
  id: string
  plan_name: string
  plan_months: number
  status: string
  expires_at: string
}

const PLANS = [
  {
    id: "1month",
    name: "Стартовый",
    months: 1,
    price: 149,
    pricePerMonth: 149,
    discount: 0,
    popular: false,
  },
  {
    id: "3months",
    name: "Оптимальный",
    months: 3,
    price: 399,
    pricePerMonth: 133,
    discount: 11,
    popular: true,
  },
  {
    id: "12months",
    name: "Годовой",
    months: 12,
    price: 999,
    pricePerMonth: 83,
    discount: 44,
    popular: false,
  },
]

const DEVICE_TYPES = [
  { id: "ios", name: "iPhone / iPad", icon: Smartphone },
  { id: "android", name: "Android", icon: Smartphone },
  { id: "windows", name: "Windows", icon: Monitor },
  { id: "macos", name: "macOS", icon: Laptop },
]

export const dynamic = "force-dynamic"

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "keys" | "plans" | "referral">("overview")
  const [profile, setProfile] = useState<any>(null)
  const [subscriptions, setSubs] = useState<Subscription[]>([])
  const [vpnKeys, setKeys] = useState<VpnKey[]>([])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [copiedRef, setCopiedRef] = useState(false)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState("")
  const [particles, setParticles] = useState<MagicParticle[]>([])
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([])

  useEffect(() => {
    initAuth()

    const newParticles: MagicParticle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      hue: Math.random() * 60 + 260,
    }))
    setParticles(newParticles)
  }, [])

  useEffect(() => {
    if (!hoveredBtn) {
      setSparkles([])
      return
    }
    const interval = setInterval(() => {
      setSparkles((prev) => {
        const newSparkle = { id: Date.now(), x: Math.random() * 100, y: Math.random() * 100 }
        return [...prev.slice(-8), newSparkle]
      })
    }, 100)
    return () => clearInterval(interval)
  }, [hoveredBtn])

  async function initAuth() {
    // 1. Сначала проверяем Supabase session (Google OAuth / реальная авторизация)
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      // Есть Supabase сессия — грузим данные из БД
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        localStorage.setItem("arcanum_user", JSON.stringify({
          id: profileData.id,
          first_name: profileData.telegram_first_name || profileData.email?.split("@")[0] || "Пользователь",
          username: profileData.telegram_username || "user",
        }))
      } else {
        // Профиля нет — создаём из Google данных
        const email = session.user.email
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email?.split("@")[0] || "Пользователь"

        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            id: session.user.id,
            email: email,
            google_id: session.user.user_metadata?.provider_id || session.user.id,
            telegram_first_name: name,
            balance: 0,
          })
          .select()
          .single()

        if (newProfile) {
          setProfile(newProfile)
          localStorage.setItem("arcanum_user", JSON.stringify({
            id: newProfile.id,
            first_name: name,
            username: email?.split("@")[0] || "user",
          }))
        }
      }

      // Грузим подписки и ключи
      const [subsRes, keysRes] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", session.user.id),
        supabase.from("vpn_keys").select("*").eq("user_id", session.user.id).eq("is_active", true),
      ])

      if (subsRes.data) setSubs(subsRes.data)
      if (keysRes.data) setKeys(keysRes.data)

      setLoading(false)
      return
    }

    // 2. Нет Supabase сессии — проверяем localStorage (тестовый режим / Telegram)
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

    // 3. Вообще ничего нет — на логин
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

  function handleLogout() {
    localStorage.removeItem("arcanum_user")
    localStorage.removeItem("arcanum_test_mode")
    supabase.auth.signOut()
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
    const names: Record<string, string> = {
      ios: "iPhone",
      android: "Android",
      windows: "Windows PC",
      macos: "MacBook",
    }
    const newKey: VpnKey = {
      id: "key_" + Date.now(),
      key_name: names[deviceType] || "Устройство",
      device_type: deviceType,
      access_url: `vless://demo-key-${Date.now()}@vpn.arcanumnox.net:443`,
      server_location: "Финляндия",
      protocol: "VLESS",
      is_active: true,
      created_at: new Date().toISOString(),
    }
    setKeys((prev) => [...prev, newKey])
    setShowAddDevice(false)
  }

  const activeSub = subscriptions.find((s) => s.status === "active")

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </main>
    )
  }

  const tabs = [
    { id: "overview" as const, label: "Обзор", icon: Zap },
    { id: "keys" as const, label: "Устройства", icon: Key },
    { id: "plans" as const, label: "Тарифы", icon: CreditCard },
    { id: "referral" as const, label: "Рефералы", icon: Users },
  ]

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Звёздное небо */}
      <StarrySky />

      {/* Мистические частицы + свечение */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse-glow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/8 rounded-full blur-[80px]"
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
              background: `radial-gradient(circle, hsla(${p.hue}, 70%, 70%, 0.8) 0%, hsla(${p.hue}, 60%, 50%, 0.4) 50%, transparent 70%)`,
              boxShadow: `0 0 ${p.size * 4}px hsla(${p.hue}, 70%, 60%, 0.6)`,
              animation: `mystical-float ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent"
              style={{ fontFamily: "serif" }}
            >
              Arcanum
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{profile?.telegram_first_name}</p>
              <p className="text-xs text-muted-foreground">@{profile?.telegram_username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="relative z-20 border-b border-white/[0.06] bg-background/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* ==================== ОБЗОР ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Приветствие */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300">Личный кабинет</span>
              </div>
              <h1
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ fontFamily: "serif" }}
              >
                <span className="text-foreground">Привет, </span>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient">
                  {profile?.telegram_first_name || "друг"}
                </span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Добро пожаловать в кабинет Arcanum VPN
              </p>
            </div>

            {/* Карточки статистики */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Wallet className="w-5 h-5" />}
                iconColor="text-purple-400"
                glowColor="from-purple-500/10"
                value={`${profile?.balance || 0} ₽`}
                label="Баланс"
                onClick={() => setShowTopUp(true)}
                onHover={() => setHoveredBtn("balance")}
                onLeave={() => setHoveredBtn(null)}
                isHovered={hoveredBtn === "balance"}
                sparkles={hoveredBtn === "balance" ? sparkles : []}
              />
              <StatCard
                icon={<Zap className="w-5 h-5" />}
                iconColor="text-green-400"
                glowColor="from-green-500/10"
                value={activeSub ? "Активна" : "Нет"}
                label={activeSub ? `до ${new Date(activeSub.expires_at).toLocaleDateString("ru-RU")}` : "Подписка"}
                onClick={() => setActiveTab("plans")}
                onHover={() => setHoveredBtn("sub")}
                onLeave={() => setHoveredBtn(null)}
                isHovered={hoveredBtn === "sub"}
                sparkles={hoveredBtn === "sub" ? sparkles : []}
              />
              <StatCard
                icon={<Key className="w-5 h-5" />}
                iconColor="text-blue-400"
                glowColor="from-blue-500/10"
                value={`${vpnKeys.length} / 5`}
                label="Устройства"
                onClick={() => setActiveTab("keys")}
                onHover={() => setHoveredBtn("devices")}
                onLeave={() => setHoveredBtn(null)}
                isHovered={hoveredBtn === "devices"}
                sparkles={hoveredBtn === "devices" ? sparkles : []}
              />
              <StatCard
                icon={<Gift className="w-5 h-5" />}
                iconColor="text-pink-400"
                glowColor="from-pink-500/10"
                value="20%"
                label="Бонус за друга"
                onClick={() => setActiveTab("referral")}
                onHover={() => setHoveredBtn("ref")}
                onLeave={() => setHoveredBtn(null)}
                isHovered={hoveredBtn === "ref"}
                sparkles={hoveredBtn === "ref" ? sparkles : []}
              />
            </div>

            {/* Быстрый старт */}
            <div className="relative rounded-3xl bg-gradient-to-br from-purple-500/20 via-card to-pink-500/20 p-[1px]">
              <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-8 overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                      backgroundSize: "32px 32px",
                    }}
                  />
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ fontFamily: "serif" }}>
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Быстрый старт
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { step: "1", title: "Выберите тариф", desc: "Пополните баланс и активируйте подписку" },
                      { step: "2", title: "Добавьте устройство", desc: "iOS, Android, Windows или macOS" },
                      { step: "3", title: "Подключитесь", desc: "Скопируйте ключ и вставьте в приложение" },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
                          {item.step}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Последние устройства */}
            {vpnKeys.length > 0 && (
              <div className="relative rounded-3xl bg-gradient-to-br from-blue-500/15 via-card to-purple-500/15 p-[1px]">
                <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-8 overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: "serif" }}>
                        <Key className="w-5 h-5 text-blue-400" />
                        Ваши устройства
                      </h3>
                      <button
                        onClick={() => setActiveTab("keys")}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Все →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {vpnKeys.slice(0, 3).map((key) => (
                        <div
                          key={key.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/20 transition-all duration-300"
                        >
                          <div className="flex items-center gap-3">
                            <DeviceIcon type={key.device_type} />
                            <div>
                              <p className="text-sm font-medium">{key.key_name}</p>
                              <p className="text-xs text-muted-foreground">{key.server_location} • {key.protocol}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(key.access_url, key.id)}
                            className={`p-2 rounded-lg transition-all duration-300 ${
                              copiedKey === key.id
                                ? "bg-green-500/15 text-green-400"
                                : "hover:bg-purple-500/10 text-muted-foreground hover:text-purple-400"
                            }`}
                          >
                            {copiedKey === key.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== УСТРОЙСТВА ==================== */}
        {activeTab === "keys" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "serif" }}>
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Устройства
                </span>
              </h2>
              {vpnKeys.length < 5 && (
                <button
                  onClick={() => setShowAddDevice(true)}
                  onMouseEnter={() => setHoveredBtn("addDevice")}
                  onMouseLeave={() => setHoveredBtn(null)}
                  className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/50 border border-border hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 text-sm font-medium overflow-hidden"
                >
                  {hoveredBtn === "addDevice" &&
                    sparkles.map((s) => (
                      <span
                        key={s.id}
                        className="absolute w-1 h-1 bg-purple-400 rounded-full pointer-events-none animate-ping"
                        style={{ left: `${s.x}%`, top: `${s.y}%` }}
                      />
                    ))}
                  <Plus className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Добавить</span>
                </button>
              )}
            </div>

            {vpnKeys.length === 0 ? (
              <div className="relative rounded-3xl bg-gradient-to-br from-purple-500/20 via-card to-pink-500/20 p-[1px]">
                <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-12 text-center overflow-hidden">
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                        backgroundSize: "32px 32px",
                      }}
                    />
                  </div>
                  <div className="relative z-10">
                    <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2" style={{ fontFamily: "serif" }}>
                      Нет подключённых устройств
                    </h3>
                    <p className="text-muted-foreground text-sm mb-8">
                      Добавьте устройство, чтобы получить VPN-ключ
                    </p>
                    <button
                      onClick={() => setShowAddDevice(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all duration-300 font-medium border border-purple-400/30 hover:shadow-lg hover:shadow-purple-500/25"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить устройство
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {vpnKeys.map((key, i) => (
                  <div
                    key={key.id}
                    className="relative rounded-3xl bg-gradient-to-br from-purple-500/15 via-card to-pink-500/15 p-[1px] animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-6 overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                              <DeviceIcon type={key.device_type} />
                            </div>
                            <div>
                              <p className="font-semibold">{key.key_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Globe className="w-3 h-3" />
                                  {key.server_location}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">{key.protocol}</span>
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                            Активен
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs text-muted-foreground bg-background/50 rounded-lg px-3 py-2.5 font-mono truncate border border-white/[0.06]">
                            {key.access_url}
                          </code>
                          <button
                            onClick={() => copyToClipboard(key.access_url, key.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                              copiedKey === key.id
                                ? "bg-green-500/15 text-green-400 border border-green-500/30"
                                : "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/20"
                            }`}
                          >
                            {copiedKey === key.id ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span className="hidden sm:inline">Скопировано</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span className="hidden sm:inline">Копировать</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== ТАРИФЫ ==================== */}
        {activeTab === "plans" && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300">Тарифы</span>
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "serif" }}>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient">
                  Выберите план
                </span>
              </h2>
              <p className="text-muted-foreground text-sm">Один аккаунт — до 5 устройств</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {PLANS.map((plan, i) => (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-[1px] transition-all duration-500 hover:shadow-2xl ${
                    plan.popular
                      ? "bg-gradient-to-br from-purple-500/40 via-card to-pink-500/40 hover:shadow-purple-500/20"
                      : "bg-gradient-to-br from-purple-500/15 via-card to-pink-500/15 hover:shadow-purple-500/10"
                  }`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-8 overflow-hidden">
                    <div className="absolute inset-0 opacity-5">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                          backgroundSize: "32px 32px",
                        }}
                      />
                    </div>
                    {plan.popular && (
                      <div className="absolute -top-0 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-b-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold">
                        Популярный
                      </div>
                    )}
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "serif" }}>{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {plan.months} {plan.months === 1 ? "месяц" : plan.months < 5 ? "месяца" : "месяцев"}
                      </p>
                      <div className="mb-1">
                        <span className="text-4xl font-bold text-foreground" style={{ fontFamily: "serif" }}>
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground ml-1">₽</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{plan.pricePerMonth} ₽/мес</p>
                      {plan.discount > 0 && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20 mb-4">
                          Скидка {plan.discount}%
                        </span>
                      )}
                      {plan.discount === 0 && <div className="mb-4" />}
                      <button
                        onClick={() => {
                          if ((profile?.balance || 0) >= plan.price) {
                            alert(`Подписка "${plan.name}" активирована! (демо)`)
                          } else {
                            setShowTopUp(true)
                          }
                        }}
                        onMouseEnter={() => setHoveredBtn(`plan-${plan.id}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        className={`relative w-full py-3.5 rounded-xl font-medium transition-all duration-300 overflow-hidden ${
                          plan.popular
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/30 hover:shadow-lg hover:shadow-purple-500/25"
                            : "bg-secondary/50 border border-border hover:border-purple-500/50 hover:bg-purple-500/10 text-foreground"
                        }`}
                      >
                        {hoveredBtn === `plan-${plan.id}` &&
                          sparkles.map((s) => (
                            <span
                              key={s.id}
                              className="absolute w-1 h-1 bg-purple-400 rounded-full pointer-events-none animate-ping"
                              style={{ left: `${s.x}%`, top: `${s.y}%` }}
                            />
                          ))}
                        <span className="relative z-10">
                          {(profile?.balance || 0) >= plan.price ? "Подключить" : "Пополнить и подключить"}
                        </span>
                      </button>
                      <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2.5">
                        {["До 5 устройств", "Все серверы", "Безлимитный трафик", "Поддержка 24/7"].map((f) => (
                          <div key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <div className="w-4 h-4 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-green-400" />
                            </div>
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trial */}
            <div className="relative rounded-3xl bg-gradient-to-br from-yellow-500/20 via-card to-orange-500/20 p-[1px]">
              <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-8 text-center overflow-hidden">
                <div className="absolute inset-0 animate-shimmer opacity-20" />
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "serif" }}>
                    🎁 15 дней бесплатно
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Попробуйте Arcanum VPN без оплаты. Без привязки карты.
                  </p>
                  <button className="px-6 py-3 rounded-xl bg-yellow-500/15 border border-yellow-500/30 hover:bg-yellow-500/25 text-yellow-300 font-medium transition-all duration-300">
                    Активировать пробный период
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== РЕФЕРАЛЫ ==================== */}
        {activeTab === "referral" && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300">Рефералы</span>
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "serif" }}>
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                  Приглашайте друзей
                </span>
              </h2>
              <p className="text-muted-foreground text-sm">Получайте 20% от их платежей</p>
            </div>

            {/* Реферальная ссылка */}
            <div className="relative rounded-3xl bg-gradient-to-br from-purple-500/20 via-card to-pink-500/20 p-[1px]">
              <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-8 overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                      backgroundSize: "32px 32px",
                    }}
                  />
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Ваша реферальная ссылка</h3>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-background/50 rounded-xl px-4 py-3.5 font-mono text-purple-300 border border-white/[0.06] truncate">
                      https://arcanumnox.net/ref/{profile?.referral_code || "loading..."}
                    </code>
                    <button
                      onClick={() => copyToClipboard(`https://arcanumnox.net/ref/${profile?.referral_code}`)}
                      onMouseEnter={() => setHoveredBtn("copyRef")}
                      onMouseLeave={() => setHoveredBtn(null)}
                      className={`relative flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium transition-all duration-300 overflow-hidden ${
                        copiedRef
                          ? "bg-green-500/15 text-green-400 border border-green-500/30"
                          : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/30 hover:shadow-lg hover:shadow-purple-500/25"
                      }`}
                    >
                      {!copiedRef && hoveredBtn === "copyRef" &&
                        sparkles.map((s) => (
                          <span
                            key={s.id}
                            className="absolute w-1 h-1 bg-white rounded-full pointer-events-none animate-ping"
                            style={{ left: `${s.x}%`, top: `${s.y}%` }}
                          />
                        ))}
                      {copiedRef ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="relative z-10">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="relative z-10">Копировать</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Приглашено", value: "0", icon: Users, color: "text-purple-400" },
                { label: "Заработано", value: "0 ₽", icon: Wallet, color: "text-green-400" },
                { label: "Бонус", value: "20%", icon: Gift, color: "text-pink-400" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="relative rounded-3xl bg-gradient-to-br from-purple-500/15 via-card to-pink-500/15 p-[1px]"
                >
                  <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-6 text-center overflow-hidden">
                    <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-3`} />
                    <p className="text-2xl font-bold mb-1" style={{ fontFamily: "serif" }}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Как это работает */}
            <div className="relative rounded-3xl bg-gradient-to-br from-purple-500/20 via-card to-pink-500/20 p-[1px]">
              <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-8 overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: "serif" }}>Как это работает</h3>
                  <div className="space-y-5">
                    {[
                      { step: "1", title: "Поделитесь ссылкой", desc: "Отправьте реферальную ссылку друзьям" },
                      { step: "2", title: "Друг регистрируется", desc: "И покупает любой тариф" },
                      { step: "3", title: "Получите бонус", desc: "20% от каждого платежа друга — навсегда" },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-sm font-bold text-purple-400">
                          {item.step}
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== МОДАЛКА: Добавить устройство ==================== */}
      {showAddDevice && (
        <Modal onClose={() => setShowAddDevice(false)} title="Добавить устройство">
          <div className="grid grid-cols-2 gap-3">
            {DEVICE_TYPES.map((device) => (
              <button
                key={device.id}
                onClick={() => handleAddDevice(device.id)}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-secondary/50 border border-border hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300 hover:scale-[1.02]"
              >
                <device.icon className="w-8 h-8 text-purple-400" />
                <span className="text-sm font-medium">{device.name}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* ==================== МОДАЛКА: Пополнение ==================== */}
      {showTopUp && (
        <Modal onClose={() => setShowTopUp(false)} title="Пополнить баланс">
          <div className="space-y-5">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Сумма (₽)</label>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Введите сумму"
                className="w-full px-4 py-3.5 rounded-xl bg-background/50 border border-white/[0.08] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/40 transition-colors"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[149, 399, 999].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTopUpAmount(String(amount))}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    topUpAmount === String(amount)
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border border-purple-400/30"
                      : "bg-secondary/50 border border-border hover:border-purple-500/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {amount} ₽
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                alert(`Пополнение на ${topUpAmount} ₽ — будет подключено через Lava.ru`)
                setShowTopUp(false)
              }}
              disabled={!topUpAmount || Number(topUpAmount) <= 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all duration-300 border border-purple-400/30 hover:shadow-lg hover:shadow-purple-500/25"
            >
              Оплатить {topUpAmount ? `${topUpAmount} ₽` : ""}
            </button>
            <p className="text-xs text-center text-muted-foreground/50">
              Оплата через Lava.ru • Карты, СБП, криптовалюта
            </p>
          </div>
        </Modal>
      )}

      <style jsx>{`
        @keyframes mystical-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          33% {
            transform: translate(20px, -30px) scale(1.3);
            opacity: 0.8;
          }
          66% {
            transform: translate(-15px, -50px) scale(0.7);
            opacity: 0.5;
          }
        }
      `}</style>
    </main>
  )
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ====================

function StatCard({
  icon,
  iconColor,
  glowColor,
  value,
  label,
  onClick,
  onHover,
  onLeave,
  isHovered,
  sparkles,
}: {
  icon: React.ReactNode
  iconColor: string
  glowColor: string
  value: string
  label: string
  onClick: () => void
  onHover: () => void
  onLeave: () => void
  isHovered: boolean
  sparkles: { id: number; x: number; y: number }[]
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative group rounded-3xl bg-gradient-to-br from-purple-500/15 via-card to-pink-500/15 p-[1px] transition-all duration-500 overflow-hidden ${
        isHovered ? "shadow-lg shadow-purple-500/10" : ""
      }`}
    >
      <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-5 text-left overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        />
        {isHovered &&
          sparkles.map((s) => (
            <span
              key={s.id}
              className="absolute w-1 h-1 bg-purple-400 rounded-full pointer-events-none animate-ping"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            />
          ))}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className={iconColor}>{icon}</div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-purple-400 transition-colors duration-300" />
          </div>
          <p className="text-xl font-bold text-foreground mb-0.5" style={{ fontFamily: "serif" }}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </button>
  )
}

function DeviceIcon({ type }: { type: string }) {
  if (type === "ios" || type === "android") return <Smartphone className="w-4 h-4 text-muted-foreground" />
  if (type === "macos") return <Laptop className="w-4 h-4 text-muted-foreground" />
  return <Monitor className="w-4 h-4 text-muted-foreground" />
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-purple-500/20 via-card to-pink-500/20 p-[1px] animate-scale-in">
        <div className="relative rounded-3xl bg-card/95 backdrop-blur-xl p-8 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ fontFamily: "serif" }}>{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}