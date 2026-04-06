import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const origin = request.headers.get("origin") || request.url.split("/api")[0]

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=no_token", origin))
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Проверяем токен
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("telegram_login_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", origin))
    }

    // 2. Проверяем срок действия
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.redirect(new URL("/login?error=token_expired", origin))
    }

    // 3. Помечаем токен как использованный
    await supabaseAdmin
      .from("telegram_login_tokens")
      .update({ used: true })
      .eq("token", token)

    const telegramId = String(tokenData.telegram_id)
    const telegramUsername = tokenData.telegram_username || null
    const telegramFirstName = tokenData.telegram_first_name || "User"

    // 4. Проверяем, есть ли пользователь с таким Telegram ID
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, google_id, email")
      .eq("telegram_id", telegramId)
      .single()

    let userId: string
    let email: string

    if (existingProfile) {
      // Пользователь уже есть
      userId = existingProfile.id
      email = existingProfile.email || `tg_${telegramId}@telegram.vpn.local`
      
      // Обновляем данные Telegram
      await supabaseAdmin
        .from("profiles")
        .update({
          telegram_username: telegramUsername,
          telegram_first_name: telegramFirstName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    } else {
      // Проверяем, есть ли пользователь с таким email (Google аккаунт)
      const tempEmail = `tg_${telegramId}@telegram.vpn.local`
      
      const { data: profileByEmail } = await supabaseAdmin
        .from("profiles")
        .select("id, telegram_id")
        .eq("email", tempEmail)
        .single()

      if (profileByEmail && !profileByEmail.telegram_id) {
        // Привязываем Telegram к существующему Google аккаунту
        userId = profileByEmail.id
        email = tempEmail
        await supabaseAdmin
          .from("profiles")
          .update({
            telegram_id: telegramId,
            telegram_username: telegramUsername,
            telegram_first_name: telegramFirstName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
      } else {
        // Создаём нового пользователя через Supabase Auth
        email = tempEmail

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            telegram_id: telegramId,
            telegram_username: telegramUsername,
            full_name: telegramFirstName,
            provider: "telegram",
          },
        })

        if (authError || !authData.user) {
          console.error("Auth error:", authError)
          return NextResponse.redirect(new URL("/login?error=auth_failed", origin))
        }

        userId = authData.user.id

        // Создаём профиль
        await supabaseAdmin.from("profiles").insert({
          id: userId,
          email,
          telegram_id: telegramId,
          telegram_username: telegramUsername,
          telegram_first_name: telegramFirstName,
          balance: 0,
        })
      }
    }

    // 5. Создаём сессию
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    })

    if (sessionError || !sessionData) {
      console.error("Session error:", sessionError)
      return NextResponse.redirect(new URL("/login?error=session_failed", origin))
    }

    // 6. Создаём сессию для клиента
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })

    // Используем verifyOtp для создания сессии
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: sessionData.properties.hashed_token?.slice(0, 8) || "000000",
      type: "magiclink",
    })

    // 7. Редирект на dashboard
    const redirectUrl = new URL("/dashboard", origin)
    redirectUrl.searchParams.set("success", "true")
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Critical error:", error)
    return NextResponse.redirect(new URL("/login?error=internal_error", origin))
  }
}