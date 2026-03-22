import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  
  // Если есть code — используем PKCE flow
  if (code) {
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
      
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
    } catch (error) {
      console.error("Auth callback exception:", error)
      return NextResponse.redirect(
        new URL("/login?error=auth_failed", requestUrl.origin)
      )
    }
  }
  
  // Если code нет, но есть access_token в hash — это Implicit Flow
  // Редиректим на dashboard, он сам подхватит токен из URL hash
  const hashFragment = requestUrl.hash
  if (hashFragment && hashFragment.includes("access_token")) {
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
  }
  
  // Если нет ни code, ни токена — ошибка
  return NextResponse.redirect(
    new URL("/login?error=no_auth_data", requestUrl.origin)
  )
}