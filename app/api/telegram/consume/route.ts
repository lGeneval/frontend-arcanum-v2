import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ success: false, error: "no_token" }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1) Находим токен
  const { data: tokenRow, error: tokenErr } = await supabase
    .from("telegram_login_tokens")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .single()

  if (tokenErr || !tokenRow) {
    return NextResponse.json({ success: false, error: "invalid_token" }, { status: 400 })
  }

  // 2) Проверяем срок жизни
  if (new Date(tokenRow.expires_at) < new Date()) {
    // можно пометить used=true, чтобы не висел
    await supabase.from("telegram_login_tokens").update({ used: true }).eq("token", token)
    return NextResponse.json({ success: false, error: "token_expired" }, { status: 400 })
  }

  // 3) Помечаем использованным
  await supabase.from("telegram_login_tokens").update({ used: true }).eq("token", token)

  // 4) Достаём профиль
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("telegram_id", tokenRow.telegram_id)
    .single()

  if (profErr || !profile) {
    return NextResponse.json({ success: false, error: "profile_not_found" }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    user: {
      id: profile.id,
      telegram_id: profile.telegram_id,
      first_name: profile.telegram_first_name,
      username: profile.telegram_username,
      photo_url: profile.telegram_photo_url,
      balance: profile.balance ?? 0,
    },
  })
}