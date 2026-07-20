import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSession, currentUser } from "@/lib/auth";
import { attachIdentity, findOrCreateOAuthUser } from "@/lib/account-linking";

const OAUTH_COOKIE = "arcanum_google_oauth";

type OAuthCookie = { state?: string; verifier?: string; mode?: "login" | "link" };
type GoogleTokenResponse = { access_token?: string };
type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  picture?: string;
};

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function readOAuthCookie(value: string): OAuthCookie | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as OAuthCookie;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const failure = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/login?error=${reason}`, request.url));
    response.cookies.delete(OAUTH_COOKIE);
    return response;
  };

  const code = request.nextUrl.searchParams.get("code") || "";
  const returnedState = request.nextUrl.searchParams.get("state") || "";
  const cookie = readOAuthCookie(request.cookies.get(OAUTH_COOKIE)?.value || "");
  if (!code || !returnedState || !cookie?.state || !cookie.verifier || !safeEqual(returnedState, cookie.state)) {
    return failure("google_expired");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return failure("google_config");

  const callbackUrl = new URL("/api/auth/google/callback", request.nextUrl.origin).toString();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: cookie.verifier,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl,
    }),
    cache: "no-store",
  });
  if (!tokenResponse.ok) return failure("google_exchange");

  const token = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!token.access_token) return failure("google_exchange");
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  if (!profileResponse.ok) return failure("google_profile");

  const profile = (await profileResponse.json()) as GoogleProfile;
  if (!profile.sub || !profile.email || profile.email_verified !== true) return failure("google_profile");
  const email = profile.email.toLowerCase();
  let userId: string;
  try {
    const signedIn = cookie.mode === "link" ? await currentUser() as unknown as { id: string } | null : null;
    if (cookie.mode === "link" && signedIn) {
      await attachIdentity(signedIn.id, "google", profile.sub, { email, firstName: profile.name || profile.given_name, avatarUrl: profile.picture });
      userId = signedIn.id;
    } else {
      userId = await findOrCreateOAuthUser("google", profile.sub, { email, firstName: profile.name || profile.given_name, avatarUrl: profile.picture });
    }
  } catch {
    return failure("google_account");
  }

  await createSession(userId);
  const response = NextResponse.redirect(new URL(cookie.mode === "link" ? "/dashboard?linked=google" : "/dashboard", request.url));
  response.cookies.delete(OAUTH_COOKIE);
  return response;
}
