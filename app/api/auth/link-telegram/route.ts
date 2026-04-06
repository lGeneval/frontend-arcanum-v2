import { NextRequest, NextResponse } from "next/server"
import { createHash, createHmac } from "crypto"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, first_name, username, photo_url, auth_date, hash, userId } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Проверка подписи Telegram
    const checkString = Object.keys(body)
      .filter((key) => key !== "hash" && key !== "userId")
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

    // Проверка срока действия
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime - auth_date > 3600) {
      return NextResponse.json(
        { error: "Authentication data expired" },
        { status: 403 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Проверяем, что текущий пользователь существует
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, telegram_id")
      .eq("id", userId)
      .single()

    if (!currentProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (currentProfile.telegram_id) {
      return NextResponse.json({ error: "Telegram already linked" }, { status: 400 })
    }

    // Проверяем, что Telegram аккаунт не привязан к другому пользователю
    const { data: existingTelegramUser } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("telegram_id", String(id))
      .single()

    if (existingTelegramUser && existingTelegramUser.id !== userId) {
      return NextResponse.json({ 
        error: "Telegram account already linked to another user" 
      }, { status: 400 })
    }

    // Привязываем Telegram к профилю
    await supabaseAdmin
      .from("profiles")
      .update({
        telegram_id: String(id),
        telegram_first_name: first_name,
        telegram_username: username,
        telegram_photo_url: photo_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    return NextResponse.json({ 
      success: true, 
      message: "Telegram account linked successfully" 
    })
  } catch (error) {
    console.error("Link Telegram error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
