import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const OAUTH_COOKIE = "arcanum_google_oauth";
const base64url = (value: Buffer) => value.toString("base64url");

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return NextResponse.redirect(new URL("/login?error=google_config", request.url));

  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  const callbackUrl = new URL("/api/auth/google/callback", request.nextUrl.origin);
  const authorize = new URL("/auth/v1/authorize", supabaseUrl);
  authorize.searchParams.set("provider", "google");
  authorize.searchParams.set("redirect_to", callbackUrl.toString());
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "s256");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(OAUTH_COOKIE, verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
