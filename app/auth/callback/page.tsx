"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Callback error:", error)
          router.replace("/login?error=auth_failed")
          return
        }

        if (session) {
          const userData = {
            id: session.user.id,
            first_name: session.user.user_metadata?.full_name?.split(" ")[0] || "Пользователь",
            username: session.user.email || "",
            balance: 0,
          }
          localStorage.setItem("arcanum_user", JSON.stringify(userData))
          router.replace("/dashboard")
        } else {
          router.replace("/login?error=no_session")
        }
      } catch (err) {
        console.error("Exception in callback:", err)
        router.replace("/login?error=exception")
      }
    }

    handleCallback()
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Завершаем авторизацию...</p>
      </div>
    </main>
  )
}