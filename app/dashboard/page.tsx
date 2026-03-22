"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { StarrySky } from "@/components/starry-sky"
import { MagicButton } from "@/components/magic-button"
import { AnimatedLogo } from "@/components/animated-logo"
import {
  LogOut, CreditCard, Users, Copy, Check,
  Plus, Smartphone, Monitor, Laptop, X, Wallet, Gift,
  Globe, Zap, Sparkles, ChevronRight, Home, RefreshCw, Trash2, Clock,
} from "lucide-react"

export const dynamic = "force-dynamic"

type Tab = "overview" | "devices" | "plans" | "referral"

interface MagicParticle {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
  hue: number
}

// Новые тарифы: 1 тариф = 1 устройство, посуточная оплата
const PLANS = [
  {
    id: "basic",
    name: "BASIC",
    pricePerMonth: 100,
    pricePerDay: 3.33,
    gradient: "from-blue-500 to-indigo-600",
    description: "Базовая защита",
    features: ["1 устройство", "Все серверы", "Безлимитный трафик"],
  },
  {
    id: "pro",
    name: "PRO",
    pricePerMonth: 390,
    pricePerDay: 13,
    gradient: "from-purple-500 to-pink-600",
    popular: true,
    description: "Оптимальный выбор",
    features: ["1 устройство", "Приоритетные серверы", "Максимальная скорость", "Поддержка 24/7"],
  },
  {
    id: "elite",
    name: "ELITE",
    pricePerMonth: 790,
    pricePerDay: 26.33,
    gradient: "from-amber-500 to-orange-600",
    description: "Премиум доступ",
    features: ["1 устройство", "VIP серверы", "Максимальная скорость", "Персональная поддержка", "Приоритет подключения"],
  },
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
  { icon: Smartphone, label: "Устройства", key: "devices", sub: "Управлять", tab: "devices", gradient: "from-emerald-500 to-teal-500" },
  { icon: Gift, label: "Рефералы", key: "ref", sub: "+100₽ за друга", tab: "referral", gradient: "from-orange-500 to-amber-500" },
]

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [subscriptions, setSubs] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [particles, setParticles] = useState<MagicParticle[]>([])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [copiedRef, setCopiedRef] = useState(false)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [selectedDeviceType, setSelectedDeviceType] = useState<string | null>(null)
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
        balance: 150, // Тестовый баланс
        referral_code: "ARC" + Math.random().toString(36).substring(2, 6).toUpperCase(),
        referral_count: 0,
        referral_earnings: 0,
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
      const [subsRes, devicesRes] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", userId),
        supabase.from("vpn_keys").select("*").eq("user_id", userId).eq("is_active", true),
      ])
      if (subsRes.data) setSubs(subsRes.data)
      if (devicesRes.data) setDevices(devicesRes.data)
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

  // Выбор тарифа → сразу на выбор устройства → оплата
  function handleSelectPlan(plan: any) {
    setSelectedPlan(plan)
    setShowAddDevice(true)
  }

  // После выбора устройства → оплата
  function handleSelectDevice(deviceType: string) {
    setSelectedDeviceType(deviceType)
    setShowAddDevice(false)
    setShowPayment(true)
  }

  // Подтверждение оплаты
  function handleConfirmPayment() {
    if (!selectedPlan || !selectedDeviceType) return

    const deviceNames: Record<string, string> = {
      ios: "iPhone",
      android: "Android",
      windows: "Windows PC",
      macos: "MacBook",
    }

    const newDevice = {
      id: "device_" + Date.now(),
      device_name: deviceNames[selectedDeviceType] || "Устройство",
      device_type: selectedDeviceType,
      plan: selectedPlan.id,
      plan_name: selectedPlan.name,
      price_per_day: selectedPlan.pricePerDay,
      access_url: `vless://demo-key-${Date.now()}@vpn.arcanumnox.net:443`,
      server_location: selectedPlan.id === "elite" ? "VIP Финляндия" : "Финляндия",
      protocol: "VLESS",
      is_active: true,
      created_at: new Date().toISOString(),
      days_remaining: 30,
      can_delete_after: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Удалить можно только завтра
    }

    setDevices((prev) => [...prev, newDevice])
    setShowPayment(false)
    setSelectedPlan(null)
    setSelectedDeviceType(null)
    setActiveTab("devices")
  }

  // Замена конфигурации
  function handleReplaceConfig(deviceId: string) {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, access_url: `vless://new-config-${Date.now()}@vpn.arcanumnox.net:443` }
          : d
      )
    )
    alert("Конфигурация обновлена!")
  }

  // Проверка можно ли удалить устройство
  function canDeleteDevice(device: any) {
    if (!device.can_delete_after) return true
    return new Date() > new Date(device.can_delete_after)
  }

  // Удаление устройства
  function handleDeleteDevice(deviceId: string) {
    const device = devices.find((d) => d.id === deviceId)
    if (!device) return

    if (!canDeleteDevice(device)) {
      alert("Устройство можно удалить только на следующий день после добавления")
      return
    }

    if (confirm("Удалить устройство? Списание прекратится со следующего дня.")) {
      setDevices((prev) => prev.filter((d) => d.id !== deviceId))
    }
  }

  const activeSub = subscriptions.find((s) => s.status === "active")
  const totalDailyCharge = devices.reduce((sum, d) => sum + (d.price_per_day || 0), 0)

  const getStatValue = (key: string) => {
    if (key === "balance") return `${profile?.balance || 0} ₽`
    if (key === "sub") return devices.length > 0 ? "Активна" : "Нет"
    if (key === "devices") return `${devices.length}`
    if (key === "ref") return `${profile?.referral_count || 0}`
    return ""
  }

  const getStatSub = (key: string, defaultSub: string) => {
    if (key === "sub" && devices.length > 0) return `−${totalDailyCharge.toFixed(0)}₽/день`
    if (key === "ref") return `+${(profile?.referral_count || 0) * 100}₽ заработано`
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
    { id: "devices" as Tab, label: "Устройства", icon: Smartphone },
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
          <Link href="/" className="flex items-center gap-3 group">
            <AnimatedLogo size={40} />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent tracking-wider" style={{ fontFamily: "serif" }}>
              Arcanum
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === tab.id ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"}`}
                style={{ fontFamily: "serif" }}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground" style={{ fontFamily: "serif" }}>
                {profile?.telegram_first_name || profile?.email?.split("@")[0] || "Пользователь"}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.telegram_username ? `@${profile.telegram_username}` : profile?.email || ""}
              </p>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group">
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline text-sm" style={{ fontFamily: "serif" }}>Выйти</span>
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
                <span className="text-sm text-purple-300" style={{ fontFamily: "serif" }}>Личный кабинет</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "serif" }}>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                  Привет, {profile?.telegram_first_name || profile?.email?.split("@")[0] || "Пользователь"}!
                </span>
              </h1>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {STAT_CARDS.map((card) => (
                <button key={card.label}
                  onClick={() => card.tab ? setActiveTab(card.tab as Tab) : setShowTopUp(true)}
                  className="group relative rounded-2xl bg-card border border-purple-500/10 p-5 text-left hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 overflow-hidden">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xl font-bold text-foreground mb-1 group-hover:text-purple-300 transition-colors" style={{ fontFamily: "serif" }}>
                    {getStatValue(card.key)}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "serif" }}>
                    {card.label} · {getStatSub(card.key, card.sub)}
                  </p>
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
                </button>
              ))}
            </div>

            {/* Инфо о списании */}
            {devices.length > 0 && (
              <div className="group relative rounded-2xl bg-card border border-yellow-500/20 p-5 hover:border-yellow-500/40 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground" style={{ fontFamily: "serif" }}>Ежедневное списание</p>
                    <p className="text-sm text-muted-foreground">
                      С вашего баланса списывается <span className="text-yellow-400 font-bold">{totalDailyCharge.toFixed(0)} ₽</span> каждый день за {devices.length} {devices.length === 1 ? "устройство" : "устройства"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Start */}
            <div className="group relative rounded-2xl bg-card border border-purple-500/10 p-6 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 group-hover:text-purple-300 transition-colors" style={{ fontFamily: "serif" }}>
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                Как это работает
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { step: "1", title: "Выберите тариф", desc: "BASIC, PRO или ELITE — 1 тариф = 1 устройство" },
                  { step: "2", title: "Добавьте устройство", desc: "Выберите тип: iOS, Android, Windows, macOS" },
                  { step: "3", title: "Оплата посуточно", desc: "Деньги списываются каждый день с баланса" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "serif" }}>{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== УСТРОЙСТВА ===== */}
        {activeTab === "devices" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "serif" }}>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                  Устройства
                </span>
              </h2>
            </div>

            {devices.length === 0 ? (
              <div className="group relative rounded-2xl bg-card border border-purple-500/10 p-16 text-center hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                
                {/* Иконка устройств вместо ключа */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="w-10 h-10 text-purple-400/50" />
                </div>
                
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "serif" }}>Нет подключённых устройств</h3>
                <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
                  Выберите тариф и добавьте устройство для защиты
                </p>
                <MagicButton
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 border border-purple-400/30"
                  onClick={() => setActiveTab("plans")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить устройство
                </MagicButton>
              </div>
            ) : (
              <div className="space-y-4">
                {devices.map((device) => (
                  <div key={device.id} className="group relative rounded-2xl bg-card border border-purple-500/10 p-5 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />

                    {/* Верхняя часть */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg">
                          {device.device_type === "ios" || device.device_type === "android"
                            ? <Smartphone className="w-6 h-6 text-white" />
                            : device.device_type === "macos"
                              ? <Laptop className="w-6 h-6 text-white" />
                              : <Monitor className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold group-hover:text-purple-300 transition-colors" style={{ fontFamily: "serif" }}>
                            {device.device_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20">
                              {device.plan_name}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {device.server_location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                          Активен
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          −{device.price_per_day?.toFixed(0) || 0}₽/день
                        </p>
                      </div>
                    </div>

                    {/* Конфигурация */}
                    <div className="flex items-center gap-2 mb-4">
                      <code className="flex-1 text-xs text-muted-foreground bg-background/50 rounded-xl px-3 py-2 font-mono truncate border border-white/[0.04]">
                        {device.access_url}
                      </code>
                      <button
                        onClick={() => copyToClipboard(device.access_url, device.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${copiedKey === device.id ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-purple-500/20 text-purple-300 border border-purple-500/20 hover:bg-purple-500/30"}`}>
                        {copiedKey === device.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === device.id ? "Скопировано" : "Копировать"}
                      </button>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleReplaceConfig(device.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300">
                        <RefreshCw className="w-3 h-3" />
                        Обновить конфигурацию
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        disabled={!canDeleteDevice(device)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                          canDeleteDevice(device)
                            ? "bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20"
                            : "bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed"
                        }`}>
                        <Trash2 className="w-3 h-3" />
                        {canDeleteDevice(device) ? "Удалить" : "Удалить завтра"}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Кнопка добавить ещё */}
                <button
                  onClick={() => setActiveTab("plans")}
                  className="group relative w-full rounded-2xl border-2 border-dashed border-purple-500/20 p-8 text-center hover:border-purple-500/40 transition-all duration-300 hover:bg-purple-500/5">
                  <Plus className="w-8 h-8 text-purple-400/50 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm text-muted-foreground group-hover:text-purple-300 transition-colors" style={{ fontFamily: "serif" }}>
                    Добавить ещё устройство
                  </p>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== ТАРИФЫ ===== */}
        {activeTab === "plans" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300" style={{ fontFamily: "serif" }}>1 тариф = 1 устройство</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "serif" }}>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                  Выберите тариф
                </span>
              </h2>
              <p className="text-muted-foreground mt-2">Оплата списывается посуточно с вашего баланса</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {PLANS.map((plan, index) => (
  <div
    key={plan.id}
    className={`group relative rounded-2xl bg-card border p-7 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 flex flex-col ${
      plan.popular
        ? "border-purple-500/40 shadow-lg shadow-purple-500/10 mt-4"
        : "border-purple-500/10"
    }`}
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />

    {/* Бейдж Популярный — теперь внутри карточки */}
    {plan.popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-500/30 whitespace-nowrap z-20">
        ⭐ Популярный
      </div>
    )}

    <div className="relative z-10 flex flex-col flex-1">
      {/* Иконка */}
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg`}>
        <CreditCard className="w-7 h-7 text-white" />
      </div>

      <h3 className="text-2xl font-bold mb-1 group-hover:text-purple-300 transition-colors" style={{ fontFamily: "serif" }}>
        {plan.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

      {/* Цена */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold" style={{ fontFamily: "serif" }}>{plan.pricePerMonth}</span>
          <span className="text-muted-foreground">₽/мес</span>
        </div>
        <p className="text-sm text-purple-400 mt-1">
          ≈ {plan.pricePerDay.toFixed(0)} ₽/день
        </p>
      </div>

      {/* Фичи */}
      <div className="flex-1 space-y-2 mb-6">
        {plan.features.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            {f}
          </div>
        ))}
      </div>

      {/* Кнопка */}
      <MagicButton
        className={`w-full ${
          plan.popular
            ? "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 border border-purple-400/30"
            : "border-purple-500/30 hover:bg-purple-500/10"
        }`}
        variant={plan.popular ? "default" : "outline"}
        onClick={() => handleSelectPlan(plan)}
      >
        Выбрать
      </MagicButton>
    </div>
  </div>
))}
            </div>

            {/* Баланс */}
            <div className="group relative rounded-2xl bg-card border border-purple-500/10 p-6 hover:border-purple-500/40 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ваш баланс</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: "serif" }}>{profile?.balance || 0} ₽</p>
                  </div>
                </div>
                <MagicButton
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border border-purple-400/30"
                  onClick={() => setShowTopUp(true)}
                >
                  Пополнить
                </MagicButton>
              </div>
            </div>
          </div>
        )}

        {/* ===== РЕФЕРАЛЫ ===== */}
        {activeTab === "referral" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300" style={{ fontFamily: "serif" }}>+100₽ за каждого друга</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "serif" }}>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                  Реферальная программа
                </span>
              </h2>
              <p className="text-muted-foreground mt-2">Приглашайте друзей и получайте бонусы</p>
            </div>

            {/* Ref Link */}
            <div className="group relative rounded-2xl bg-card border border-purple-500/10 p-6 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
              <h3 className="text-sm font-medium text-muted-foreground mb-3" style={{ fontFamily: "serif" }}>Ваша реферальная ссылка</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <code className="flex-1 text-sm bg-background/50 rounded-xl px-4 py-3 font-mono text-purple-300 border border-purple-500/10 truncate">
                  https://arcanumnox.net/ref/{profile?.referral_code || "XXXXXXXX"}
                </code>
                <MagicButton
                  className={copiedRef ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border border-purple-400/30"}
                  onClick={() => copyToClipboard(`https://arcanumnox.net/ref/${profile?.referral_code}`)}
                >
                  {copiedRef ? <><Check className="w-4 h-4 mr-2" />Скопировано</> : <><Copy className="w-4 h-4 mr-2" />Копировать</>}
                </MagicButton>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Users, label: "Приглашено", value: String(profile?.referral_count || 0), gradient: "from-blue-500 to-indigo-600" },
                { icon: Wallet, label: "Заработано", value: `${(profile?.referral_count || 0) * 100} ₽`, gradient: "from-purple-500 to-pink-600" },
                { icon: Gift, label: "Бонус за друга", value: "100 ₽", gradient: "from-emerald-500 to-teal-500" },
              ].map((stat, index) => (
                <div key={stat.label}
                  className="group relative rounded-2xl bg-card border border-purple-500/10 p-6 text-center hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold mb-1 group-hover:text-purple-300 transition-colors" style={{ fontFamily: "serif" }}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="group relative rounded-2xl bg-card border border-purple-500/10 p-6 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 group-hover:text-purple-300 transition-colors" style={{ fontFamily: "serif" }}>
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                Как это работает
              </h3>
              <div className="space-y-5">
                {[
                  { step: "1", title: "Поделитесь ссылкой", desc: "Отправьте реферальную ссылку друзьям" },
                  { step: "2", title: "Друг регистрируется", desc: "И начинает пользоваться Arcanum VPN" },
                  { step: "3", title: "Получите 100₽", desc: "Бонус зачисляется сразу на ваш баланс" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground" style={{ fontFamily: "serif" }}>{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Мобильная навигация */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-background/80 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-300 ${activeTab === tab.id ? "bg-purple-500/20 text-purple-300" : "text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === tab.id ? "scale-110" : ""}`} />
              <span className="text-[10px] font-medium" style={{ fontFamily: "serif" }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Модалка: Выбор устройства */}
      {showAddDevice && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-purple-500/20 shadow-2xl shadow-purple-500/20 animate-scale-in overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-[0.03]" />
            <div className="relative p-7">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "serif" }}>Выберите устройство</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Тариф: <span className="text-purple-300">{selectedPlan.name}</span> — {selectedPlan.pricePerDay.toFixed(0)}₽/день
                  </p>
                </div>
                <button onClick={() => { setShowAddDevice(false); setSelectedPlan(null) }} className="p-2 rounded-xl hover:bg-purple-500/10 transition-colors text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {DEVICE_TYPES.map((device) => (
                  <button key={device.id} onClick={() => handleSelectDevice(device.id)}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-purple-500/10 bg-card hover:bg-purple-500/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                    <device.icon className="w-8 h-8 text-muted-foreground group-hover:text-purple-400 transition-colors duration-300 group-hover:scale-110 transform relative z-10" />
                    <span className="text-sm font-medium relative z-10" style={{ fontFamily: "serif" }}>{device.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка: Подтверждение оплаты */}
      {showPayment && selectedPlan && selectedDeviceType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-purple-500/20 shadow-2xl shadow-purple-500/20 animate-scale-in overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-[0.03]" />
            <div className="relative p-7">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ fontFamily: "serif" }}>Подтверждение</h3>
                <button onClick={() => { setShowPayment(false); setSelectedPlan(null); setSelectedDeviceType(null) }} className="p-2 rounded-xl hover:bg-purple-500/10 transition-colors text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-4 rounded-xl bg-background/50 border border-purple-500/10">
                  <span className="text-muted-foreground">Тариф</span>
                  <span className="font-semibold text-purple-300">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-background/50 border border-purple-500/10">
                  <span className="text-muted-foreground">Устройство</span>
                  <span className="font-semibold text-purple-300">
                    {DEVICE_TYPES.find(d => d.id === selectedDeviceType)?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-background/50 border border-purple-500/10">
                  <span className="text-muted-foreground">Ежедневное списание</span>
                  <span className="font-semibold text-yellow-400">{selectedPlan.pricePerDay.toFixed(0)} ₽/день</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <span className="text-muted-foreground">Ваш баланс</span>
                  <span className="font-bold text-foreground">{profile?.balance || 0} ₽</span>
                </div>
              </div>

              {(profile?.balance || 0) < selectedPlan.pricePerDay ? (
                <div className="space-y-3">
                  <p className="text-sm text-red-400 text-center">
                    Недостаточно средств. Пополните баланс минимум на {selectedPlan.pricePerDay.toFixed(0)} ₽
                  </p>
                  <MagicButton
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border border-purple-400/30"
                    onClick={() => { setShowPayment(false); setShowTopUp(true) }}
                  >
                    Пополнить баланс
                  </MagicButton>
                </div>
              ) : (
                <MagicButton
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 border border-purple-400/30"
                  onClick={handleConfirmPayment}
                >
                  Подтвердить и подключить
                </MagicButton>
              )}

              <p className="text-xs text-center text-muted-foreground mt-4">
                Деньги будут списываться ежедневно пока устройство активно
              </p>
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
                <h3 className="text-xl font-bold" style={{ fontFamily: "serif" }}>Пополнить баланс</h3>
                <button onClick={() => setShowTopUp(false)} className="p-2 rounded-xl hover:bg-purple-500/10 transition-colors text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block" style={{ fontFamily: "serif" }}>Сумма (₽)</label>
                  <input type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} placeholder="Введите сумму"
                    className="w-full px-4 py-3 rounded-xl bg-background/50 border border-purple-500/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 transition-colors" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 300, 500].map((amount) => (
                    <button key={amount} onClick={() => setTopUpAmount(String(amount))}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${topUpAmount === String(amount) ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25" : "bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20"}`}
                      style={{ fontFamily: "serif" }}>
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