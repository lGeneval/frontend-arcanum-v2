import { Suspense } from "react"
import TelegramLoginClient from "./telegram-login-client"

export const dynamic = "force-dynamic"

export default function TelegramLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Авторизация через Telegram...</p>
          </div>
        </main>
      }
    >
      <TelegramLoginClient />
    </Suspense>
  )
}