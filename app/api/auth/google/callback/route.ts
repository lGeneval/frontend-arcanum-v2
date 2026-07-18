import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const OAUTH_COOKIE = "arcanum_google_oauth";
type TokenResponse = { user?: { id: string; email?: string; user_metadata?: { full_name?: string; name?: string; avatar_url?: string; picture?: string } } };

export async function GET(request: NextRequest) {
  const failure = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/login?error=${reason}`, request.url));
    response.cookies.delete(OAUTH_COOKIE);
    return response;
  };
  const code = request.nextUrl.searchParams.get("code") || "";
  const verifier = request.cookies.get(OAUTH_COOKIE)?.value || "";
  if (!code || !verifier) return failure("google_expired");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return failure("google_config");
  const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    cache: "no-store",
  });
  if (!tokenResponse.ok) return failure("google_exchange");

  const token = (await tokenResponse.json()) as TokenResponse;
  if (!token.user?.id || !token.user.email) return failure("google_profile");
  const metadata = token.user.user_metadata || {};
  const { data: user, error } = await supabaseAdmin().from("users").upsert({
    google_id: token.user.id,
    email: token.user.email.toLowerCase(),
    first_name: metadata.full_name || metadata.name || token.user.email.split("@")[0],
    avatar_url: metadata.avatar_url || metadata.picture || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "google_id" }).select("id").single();
  if (error || !user) return failure("google_account");

  await createSession(user.id);
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.delete(OAUTH_COOKIE);
  return response;
}
