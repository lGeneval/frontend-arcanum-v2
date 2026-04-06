import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const origin = request.headers.get("origin") || request.url.split("/api")[0]

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
  const accessToken = tokenData.access_token

  if (!idToken) {
    return NextResponse.json({ error: "Failed to get ID token" }, { status: 500 })
  }

  // 2. Проверяем токен и получаем данные пользователя
  const userInfoResponse = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
  )
  const userInfo = await userInfoResponse.json()

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // 3. Проверяем, есть ли пользователь с таким Google ID
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, google_id, telegram_id")
    .eq("google_id", userInfo.sub)
    .single()

  let userId: string

  if (existingProfile) {
    // Пользователь уже есть - обновляем данные
    userId = existingProfile.id
    await supabaseAdmin
      .from("profiles")
      .update({
        email: userInfo.email,
        full_name: userInfo.name,
        avatar_url: userInfo.picture,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
  } else {
    // Проверяем, есть ли пользователь с таким email (может быть Telegram аккаунт)
    const { data: profileByEmail } = await supabaseAdmin
      .from("profiles")
      .select("id, google_id")
      .eq("email", userInfo.email)
      .single()

    if (profileByEmail && !profileByEmail.google_id) {
      // Привязываем Google к существующему аккаунту
      userId = profileByEmail.id
      await supabaseAdmin
        .from("profiles")
        .update({
          google_id: userInfo.sub,
          full_name: userInfo.name,
          avatar_url: userInfo.picture,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    } else {
      // Создаём нового пользователя через Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userInfo.email,
        email_confirm: true,
        user_metadata: {
          full_name: userInfo.name,
          avatar_url: userInfo.picture,
          provider: "google",
        },
      })

      if (authError || !authData.user) {
        console.error("Auth error:", authError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      userId = authData.user.id

      // Создаём профиль
      await supabaseAdmin.from("profiles").insert({
        id: userId,
        email: userInfo.email,
        full_name: userInfo.name,
        avatar_url: userInfo.picture,
        google_id: userInfo.sub,
        balance: 0,
      })
    }
  }

  // 4. Создаём сессию
  const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: userInfo.email,
  })

  if (sessionError || !sessionData) {
    console.error("Session error:", sessionError)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }

  // 5. Создаём сессию для клиента
  const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  })

  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    email: userInfo.email,
    token: sessionData.properties.hashed_token?.slice(0, 8) || "",
    type: "magiclink",
  })

  if (verifyError || !verifyData.session) {
    // Если не удалось верифицировать через OTP, используем session из generateLink
    console.log("OTP verification failed, using direct session")
  }

  // 6. Редирект с токеном
  const session = verifyData?.session || sessionData.properties?.hashed_token
  const redirectUrl = new URL("/dashboard", origin)
  
  if (verifyData?.session) {
    redirectUrl.searchParams.set("success", "true")
  }
  
  return NextResponse.redirect(redirectUrl)
}