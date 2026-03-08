import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const BOT_API_SECRET = Deno.env.get("BOT_API_SECRET")!
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "*").split(",")

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || ""
  const allowed = ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

function jsonResponse(body: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req || new Request("http://localhost")),
      "Content-Type": "application/json",
    },
  })
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req)
  }

  try {
    const body = await req.json()
    const { action } = body

    switch (action) {

      case "create-token": {
        const {
          telegram_id,
          telegram_username,
          telegram_first_name,
          bot_secret
        } = body

        if (bot_secret !== BOT_API_SECRET) {
          return jsonResponse({ error: "Unauthorized" }, 401, req)
        }

        if (!telegram_id) {
          return jsonResponse({ error: "telegram_id required" }, 400, req)
        }

        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        const rateLimitOk = await checkRateLimit(
          admin, `tg_${telegram_id}`, "create_token", 5, 60
        )
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many requests" }, 429, req)
        }

        await findOrCreateUser(
          admin, telegram_id, telegram_username, telegram_first_name
        )

        const token = generateToken()

        const { error: insertErr } = await admin.from("auth_tokens").insert({
          token,
          telegram_id: Number(telegram_id),
          status: "confirmed",
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })

        if (insertErr) {
          console.error("Insert token error:", insertErr)
          return jsonResponse({ error: "Failed to create token" }, 500, req)
        }

        return jsonResponse({ token, expires_in: 300 }, 200, req)
      }

      case "validate-token": {
        const { token } = body

        if (!token || typeof token !== "string" || token.length < 32) {
          return jsonResponse({ error: "Invalid token format" }, 400, req)
        }

        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
          || req.headers.get("cf-connecting-ip")
          || "unknown"

        const rateLimitOk = await checkRateLimit(
          admin, `ip_${clientIP}`, "validate_token", 10, 60
        )
        if (!rateLimitOk) {
          return jsonResponse({ error: "Too many attempts" }, 429, req)
        }

        const { data: authToken, error: findErr } = await admin
          .from("auth_tokens")
          .select("*")
          .eq("token", token)
          .eq("status", "confirmed")
          .gt("expires_at", new Date().toISOString())
          .single()

        if (findErr || !authToken) {
          return jsonResponse({ error: "Invalid or expired token" }, 401, req)
        }

        await admin.from("auth_tokens").update({
          status: "used",
          used_at: new Date().toISOString(),
          ip_address: clientIP,
        }).eq("id", authToken.id)

        const email = `tg_${authToken.telegram_id}@telegram.vpn.local`

        const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: "magiclink",
          email,
        })

        if (linkErr) {
          console.error("Generate link error:", linkErr)
          return jsonResponse({ error: "Auth failed" }, 500, req)
        }

        const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        const { data: sessionData, error: sessionErr } = await anonClient.auth.verifyOtp({
          token_hash: linkData.properties.hashed_token,
          type: "magiclink",
        })

        if (sessionErr || !sessionData.session) {
          console.error("Session error:", sessionErr)
          return jsonResponse({ error: "Session creation failed" }, 500, req)
        }

        return jsonResponse({
          session: {
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token,
            expires_at: sessionData.session.expires_at,
          },
          user: {
            id: sessionData.user!.id,
            telegram_id: authToken.telegram_id,
          },
        }, 200, req)
      }

      default:
        return jsonResponse({ error: "Unknown action" }, 400, req)
    }

  } catch (err) {
    console.error("Edge function error:", err)
    return jsonResponse({ error: "Internal server error" }, 500, req)
  }
})


async function findOrCreateUser(
  admin: ReturnType<typeof createClient>,
  telegramId: number | string,
  username?: string,
  firstName?: string,
) {
  const tgId = Number(telegramId)
  const email = `tg_${tgId}@telegram.vpn.local`

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("telegram_id", tgId)
    .single()

  if (existing) {
    await admin.from("profiles").update({
      telegram_username: username || null,
      telegram_first_name: firstName || null,
    }).eq("id", existing.id)
    return existing.id
  }

  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      telegram_id: tgId,
      telegram_username: username,
    },
  })

  if (createErr) {
    const { data: link } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    })
    if (link?.user) {
      await admin.from("profiles").upsert({
        id: link.user.id,
        telegram_id: tgId,
        telegram_username: username || null,
        telegram_first_name: firstName || null,
      })
      return link.user.id
    }
    throw createErr
  }

  await admin.from("profiles").insert({
    id: newUser.user.id,
    telegram_id: tgId,
    telegram_username: username || null,
    telegram_first_name: firstName || null,
  })

  return newUser.user.id
}


function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}


async function checkRateLimit(
  admin: ReturnType<typeof createClient>,
  identifier: string,
  action: string,
  maxHits: number,
  windowSeconds: number,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  const { data: existing } = await admin
    .from("rate_limits")
    .select("hit_count, window_start")
    .eq("identifier", identifier)
    .eq("action", action)
    .single()

  if (!existing) {
    await admin.from("rate_limits").upsert({
      identifier,
      action,
      hit_count: 1,
      window_start: new Date().toISOString(),
    })
    return true
  }

  if (existing.window_start < windowStart) {
    await admin.from("rate_limits").update({
      hit_count: 1,
      window_start: new Date().toISOString(),
    }).eq("identifier", identifier).eq("action", action)
    return true
  }

  if (existing.hit_count >= maxHits) {
    return false
  }

  await admin.from("rate_limits").update({
    hit_count: existing.hit_count + 1,
  }).eq("identifier", identifier).eq("action", action)

  return true
}