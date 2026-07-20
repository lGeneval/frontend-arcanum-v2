import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

const OAUTH_COOKIE = "arcanum_google_oauth";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google_config", request.url));
  }

  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const user = await currentUser() as unknown as { id: string } | null;
  const mode = request.nextUrl.searchParams.get("mode") === "link" && user ? "link" : "login";
  const callbackUrl = new URL("/api/auth/google/callback", request.nextUrl.origin);
  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", callbackUrl.toString());
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid email profile");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  authorize.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(
    OAUTH_COOKIE,
    Buffer.from(JSON.stringify({ state, verifier, mode })).toString("base64url"),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    },
  );
  return response;
}
