import { supabaseAdmin } from "@/lib/supabase-admin";

export type Provider = "google" | "apple" | "telegram";

export async function attachIdentity(
  targetUserId: string,
  provider: Provider,
  providerId: string,
  profile: { email?: string | null; firstName?: string | null; avatarUrl?: string | null; telegramUsername?: string | null } = {},
) {
  const db = supabaseAdmin();
  const identityColumn = provider === "google" ? "google_id" : provider === "apple" ? "apple_id" : "telegram_id";
  const { data: existing } = await db.from("users").select("id").eq(identityColumn, providerId).maybeSingle();

  if (existing && existing.id !== targetUserId) {
    const { error } = await db.rpc("merge_user_accounts", { primary_id: targetUserId, secondary_id: existing.id });
    if (error) throw new Error(`merge_failed:${error.message}`);
  }

  const update: Record<string, unknown> = {
    [identityColumn]: provider === "telegram" ? Number(providerId) : providerId,
    updated_at: new Date().toISOString(),
  };
  if (profile.email) update.email = profile.email.toLowerCase();
  if (profile.firstName) update.first_name = profile.firstName;
  if (profile.avatarUrl) update.avatar_url = profile.avatarUrl;
  if (profile.telegramUsername !== undefined) update.telegram_username = profile.telegramUsername;

  const { error } = await db.from("users").update(update).eq("id", targetUserId);
  if (error) throw error;
}

export async function findOrCreateOAuthUser(
  provider: "google" | "apple",
  providerId: string,
  profile: { email?: string | null; firstName?: string | null; avatarUrl?: string | null },
) {
  const db = supabaseAdmin();
  const identityColumn = provider === "google" ? "google_id" : "apple_id";
  const { data: existing } = await db.from("users").select("id").eq(identityColumn, providerId).maybeSingle();
  if (existing) return existing.id as string;

  const insert: Record<string, unknown> = {
    [identityColumn]: providerId,
    email: profile.email?.toLowerCase() || null,
    first_name: profile.firstName || profile.email?.split("@")[0] || "Пользователь",
    avatar_url: profile.avatarUrl || null,
    updated_at: new Date().toISOString(),
  };
  const { data: created, error } = await db.from("users").insert(insert).select("id").single();
  if (error || !created) throw error || new Error("account_create_failed");
  return created.id as string;
}
