import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json()

    if (!code || !userId) {
      return NextResponse.json({ error: "Missing code or userId" }, { status: 400 })
    }

    // 1. Обмениваем код на токены Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_LINK_REDIRECT_URI!,
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

    // 3. Проверяем, что текущий пользователь существует
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, google_id")
      .eq("id", userId)
      .single()

    if (!currentProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (currentProfile.google_id) {
      return NextResponse.json({ error: "Google already linked" }, { status: 400 })
    }

    // 4. Проверяем, что Google аккаунт не привязан к другому пользователю
    const { data: existingGoogleUser } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("google_id", userInfo.sub)
      .single()

    if (existingGoogleUser && existingGoogleUser.id !== userId) {
      return NextResponse.json({ 
        error: "Google account already linked to another user" 
      }, { status: 400 })
    }

    // 5. Привязываем Google к профилю
    await supabaseAdmin
      .from("profiles")
      .update({
        google_id: userInfo.sub,
        email: userInfo.email,
        full_name: userInfo.name,
        avatar_url: userInfo.picture,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    return NextResponse.json({ 
      success: true, 
      message: "Google account linked successfully" 
    })
  } catch (error) {
    console.error("Link Google error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
