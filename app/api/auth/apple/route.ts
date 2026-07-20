import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

const OAUTH_COOKIE = "arcanum_apple_oauth";

export async function GET(request: NextRequest) {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/login?error=apple_config", request.url));
  const user = await currentUser() as unknown as { id: string } | null;
  const mode = request.nextUrl.searchParams.get("mode") === "link" && user ? "link" : "login";
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const callbackUrl = new URL("/api/auth/apple/callback", request.nextUrl.origin).toString();
  const authorize = new URL("https://appleid.apple.com/auth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", callbackUrl);
  authorize.searchParams.set("response_type", "code id_token");
  authorize.searchParams.set("response_mode", "form_post");
  authorize.searchParams.set("scope", "name email");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("nonce", nonce);
  const response = NextResponse.redirect(authorize);
  response.cookies.set(OAUTH_COOKIE, Buffer.from(JSON.stringify({ state, nonce, mode })).toString("base64url"), {
    httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 10 * 60,
  });
  return response;
}
