import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { telegram_id, first_name, username, photo_url } = await request.json()

    if (!telegram_id) {
      return NextResponse.json({ error: "Missing telegram_id" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Проверяем, есть ли пользователь
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, google_id, balance")
      .eq("telegram_id", String(telegram_id))
      .single()

    // Создаём или обновляем профиль
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          telegram_id: String(telegram_id),
          telegram_first_name: first_name,
          telegram_username: username,
          telegram_photo_url: photo_url,
          balance: existingProfile?.balance ?? 0,
        },
        { onConflict: "telegram_id" }
      )
      .select()
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Генерируем одноразовый токен
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 минут

    // Сохраняем токен в БД с дополнительными данными
    await supabase.from("telegram_login_tokens").insert({
      token,
      telegram_id: String(telegram_id),
      telegram_first_name: first_name,
      telegram_username: username,
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    // Возвращаем ссылку для авторизации
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arcanumnox.net"
    const loginUrl = `${baseUrl}/auth/telegram-login?token=${token}`

    return NextResponse.json({ success: true, login_url: loginUrl })
  } catch (error) {
    console.error("Generate login link error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}