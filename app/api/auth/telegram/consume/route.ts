import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Проверяем токен
    const { data: tokenData, error: tokenError } = await supabase
      .from("telegram_login_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // 2. Проверяем срок действия
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 })
    }

    // 3. Помечаем токен как использованный
    await supabase
      .from("telegram_login_tokens")
      .update({ used: true })
      .eq("token", token)

    // 4. Ищем или создаем профиль
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          telegram_id: String(tokenData.telegram_id),
          // Если профиль уже есть, обновляем имя (на случай смены)
          telegram_first_name: "User", // Можно передавать имя из токена, если сохраняем
          balance: 0,
        },
        { onConflict: "telegram_id" }
      )
      .select()
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // 5. Возвращаем данные пользователя
    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        telegram_id: profile.telegram_id,
        first_name: profile.telegram_first_name,
        username: profile.telegram_username,
        photo_url: profile.telegram_photo_url,
        balance: profile.balance,
      },
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}