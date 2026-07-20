import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSession, currentUser } from "@/lib/auth";
import { attachIdentity, findOrCreateOAuthUser } from "@/lib/account-linking";
import { appleClientSecret, verifyAppleIdToken } from "@/lib/apple-oauth";

const OAUTH_COOKIE = "arcanum_apple_oauth";
type OAuthCookie = { state?: string; nonce?: string; mode?: "login" | "link" };
const equal = (a: string, b: string) => { const left=Buffer.from(a),right=Buffer.from(b);return left.length===right.length&&timingSafeEqual(left,right); };
const readCookie = (value: string): OAuthCookie | null => { try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")); } catch { return null; } };

export async function POST(request: NextRequest) {
  const failure = (reason: string) => { const response=NextResponse.redirect(new URL(`/login?error=${reason}`,request.url),303);response.cookies.delete(OAUTH_COOKIE);return response; };
  const form = await request.formData();
  const code = String(form.get("code") || "");
  const returnedState = String(form.get("state") || "");
  const cookie = readCookie(request.cookies.get(OAUTH_COOKIE)?.value || "");
  if (!code || !returnedState || !cookie?.state || !equal(returnedState, cookie.state)) return failure("apple_expired");
  const clientId = process.env.APPLE_CLIENT_ID;
  const clientSecret = appleClientSecret();
  if (!clientId || !clientSecret) return failure("apple_config");
  const callbackUrl = new URL("/api/auth/apple/callback", request.nextUrl.origin).toString();
  const tokenResponse = await fetch("https://appleid.apple.com/auth/token", { method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,code,grant_type:"authorization_code",redirect_uri:callbackUrl}),cache:"no-store" });
  if (!tokenResponse.ok) return failure("apple_exchange");
  const token = await tokenResponse.json() as { id_token?: string };
  const claims = token.id_token && cookie.nonce ? await verifyAppleIdToken(token.id_token, cookie.nonce) : null;
  if (!claims?.sub) return failure("apple_profile");
  const email = claims.email?.toLowerCase() || null;
  let firstName: string | null = null;
  const rawUser = form.get("user");
  if (rawUser) { try { const value=JSON.parse(String(rawUser)) as {name?:{firstName?:string}};firstName=value.name?.firstName||null; } catch {} }
  try {
    const signedIn = cookie.mode === "link" ? await currentUser() as unknown as { id: string } | null : null;
    const userId = cookie.mode === "link" && signedIn
      ? (await attachIdentity(signedIn.id,"apple",claims.sub,{email,firstName}),signedIn.id)
      : await findOrCreateOAuthUser("apple",claims.sub,{email,firstName});
    await createSession(userId);
    const response=NextResponse.redirect(new URL(cookie.mode === "link" ? "/dashboard?linked=apple" : "/dashboard",request.url),303);
    response.cookies.delete(OAUTH_COOKIE);
    return response;
  } catch { return failure("apple_account"); }
}
