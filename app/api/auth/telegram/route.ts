import { NextRequest, NextResponse } from "next/server"
import { createHash, createHmac } from "crypto"
import { createClient } from "@supabase/supabase-js"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, first_name, username, photo_url, auth_date, hash } = body

    // Проверка подписи Telegram
    const checkString = Object.keys(body)
      .filter((key) => key !== "hash")
      .sort()
      .map((key) => `${key}=${body[key]}`)
      .join("\n")

    const secretKey = createHash("sha256")
      .update(TELEGRAM_BOT_TOKEN)
      .digest()

    const hmac = createHmac("sha256", secretKey)
      .update(checkString)
      .digest("hex")

    if (hmac !== hash) {
      return NextResponse.json(
        { error: "Invalid authentication data" },
        { status: 403 }
      )
    }

    // Проверка срока действия (не старше 1 часа)
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime - auth_date > 3600) {
      return NextResponse.json(
        { error: "Authentication data expired" },
        { status: 403 }
      )
    }

    // Создаём/обновляем профиль в Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          telegram_id: String(id),
          telegram_first_name: first_name,
          telegram_username: username,
          telegram_photo_url: photo_url,
          balance: 0,
        },
        { onConflict: "telegram_id" }
      )
      .select()
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      )
    }

    // Возвращаем данные для сохранения в localStorage
    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        telegram_id: id,
        first_name,
        username,
        photo_url,
        balance: profile.balance,
      },
    })
  } catch (error) {
    console.error("Telegram auth error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}