import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestParams.get("code")

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=no_code", requestUrl.origin)
    )
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(
        new URL("/login?error=auth_failed", requestUrl.origin)
      )
    }
  } catch (error) {
    console.error("Auth callback exception:", error)
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", requestUrl.origin)
    )
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
}