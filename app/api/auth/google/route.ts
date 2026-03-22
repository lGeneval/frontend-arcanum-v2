import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 })
  }

  // 1. Обмениваем код на токены Google
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  })

  const tokenData = await tokenResponse.json()
  const idToken = tokenData.id_token

  if (!idToken) {
    return NextResponse.json({ error: "Failed to get ID token" }, { status: 500 })
  }

  // 2. Проверяем токен и получаем данные пользователя
  const userInfoResponse = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?id_token=${idToken}`
  )
  const userInfo = await userInfoResponse.json()

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 3. Создаем или обновляем профиль
  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        google_id: userInfo.sub,
        email: userInfo.email,
        full_name: userInfo.name,
        avatar_url: userInfo.picture,
      },
      { onConflict: "google_id" }
    )
    .select()
    .single()

  if (error) {
    console.error("Google Auth Error:", error)
    return NextResponse.json({ error: "Auth failed" }, { status: 500 })
  }

  // 4. Редирект на сайт с токеном (как мы делали для Телеграма)
  // Для простоты просто кидаем в дашборд, localStorage сам подхватит
  // Но лучше сделать через /api/auth/callback-success как у нас было
  
  // Пока просто редирект:
  return NextResponse.redirect(new URL("/dashboard", request.url))
}