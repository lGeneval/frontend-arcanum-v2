import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { attachIdentity } from "@/lib/account-linking";

type TelegramUpdate = { message?: { text?: string; chat: { id: number }; from?: { id: number; username?: string; first_name?: string } } };
const equal = (left: string, right: string) => { const a=Buffer.from(left),b=Buffer.from(right);return a.length===b.length&&timingSafeEqual(a,b); };
const botName = () => process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "arcanumvpnbot";
const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://arcanumnox.net";

export async function POST(request: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const actual = request.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!expected || !equal(actual, expected)) return NextResponse.json({ ok: false }, { status: 401 });

  const update = await request.json() as TelegramUpdate;
  const message = update.message;
  if (!message?.from) return NextResponse.json({ ok: true });
  const db = supabaseAdmin();
  const { data: user, error } = await db.from("users").upsert({ telegram_id: message.from.id, telegram_username: message.from.username || null, first_name: message.from.first_name || null, updated_at: new Date().toISOString() }, { onConflict: "telegram_id" }).select("id,referral_code,referred_by").single();
  if (error || !user) return NextResponse.json({ ok: false }, { status: 500 });

  const text = message.text?.trim() || "";
  const startPayload = text.startsWith("/start ") ? text.slice(7).trim() : "";
  if (startPayload.startsWith("link_")) {
    await linkTelegramAccount(message.chat.id, user.id, message.from, startPayload.slice(5));
    return NextResponse.json({ ok: true });
  }
  if (startPayload.startsWith("ref_")) await attachReferral(user.id, user.referred_by, startPayload.slice(4));

  if (startPayload === "login" || text === "/cabinet") await sendLogin(message.chat.id, user.id);
  else if (startPayload === "help" || text === "/help" || text === "Помощь") await sendHelp(message.chat.id);
  else if (startPayload === "mirror" || text === "/mirror" || text === "Кабинет не работает") await sendMirrors(message.chat.id, user.id);
  else await sendMenu(message.chat.id, user.referral_code, Boolean(startPayload.startsWith("ref_")));
  return NextResponse.json({ ok: true });
}

async function linkTelegramAccount(chatId: number, telegramUserId: string, telegram: { id: number; username?: string; first_name?: string }, raw: string) {
  const db = supabaseAdmin();
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  const { data: link } = await db.from("telegram_link_tokens").select("id,user_id").eq("token_hash", tokenHash).is("used_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!link) { await sendTelegramMessage(chatId, "Ссылка привязки истекла. Создайте новую в личном кабинете."); return; }
  try {
    await attachIdentity(link.user_id, "telegram", String(telegram.id), { firstName: telegram.first_name, telegramUsername: telegram.username || null });
    await db.from("telegram_link_tokens").update({ used_at: new Date().toISOString() }).eq("id", link.id).is("used_at", null);
    if (telegramUserId !== link.user_id) await db.from("sessions").delete().eq("user_id", telegramUserId);
    await sendTelegramMessage(chatId, "✅ Telegram успешно привязан к вашему единому профилю Arcanum. Вернитесь в личный кабинет и обновите страницу.");
  } catch {
    await sendTelegramMessage(chatId, "Не удалось объединить профили. Обратитесь в поддержку — ваши данные не были изменены.");
  }
}

async function attachReferral(userId: string, referredBy: string | null, code: string) {
  if (referredBy) return;
  const db = supabaseAdmin();
  const { data: referrer } = await db.from("users").select("id").eq("referral_code", code.toUpperCase()).neq("id", userId).maybeSingle();
  if (!referrer) return;
  const { data: updated } = await db.from("users").update({ referred_by: referrer.id }).eq("id", userId).is("referred_by", null).select("id").maybeSingle();
  if (updated) await db.from("referrals").upsert({ referrer_id: referrer.id, invited_user_id: userId }, { onConflict: "invited_user_id" });
}

async function sendLogin(chatId: number, userId: string) {
  const raw = randomBytes(32).toString("base64url");
  await supabaseAdmin().from("telegram_login_tokens").insert({ user_id: userId, token_hash: createHash("sha256").update(raw).digest("hex"), expires_at: new Date(Date.now()+5*60_000).toISOString() });
  await sendTelegramMessage(chatId, "Нажмите кнопку, чтобы безопасно войти в личный кабинет. Ссылка одноразовая и действует 5 минут.", { inline_keyboard: [[{ text: "Открыть личный кабинет", url: `${siteUrl()}/api/auth/telegram/consume?token=${raw}` }], [{ text: "Кабинет не открывается", url: `https://t.me/${botName()}?start=mirror` }]] });
}

async function sendMenu(chatId: number, referralCode: string, referred: boolean) {
  const prefix = referred ? "Вы перешли по приглашению друга. Добро пожаловать!\n\n" : "";
  await sendTelegramMessage(chatId, `${prefix}<b>Arcanum</b>\n\nУправляйте подпиской, устройствами и семейной группой в личном кабинете.`, { inline_keyboard: [[{ text: "Личный кабинет", url: `https://t.me/${botName()}?start=login` }], [{ text: "Пригласить друга", switch_inline_query: `Попробуй Arcanum: https://t.me/${botName()}?start=ref_${referralCode}` }], [{ text: "Помощь", url: `https://t.me/${botName()}?start=help` }]] });
}

async function sendHelp(chatId: number) { await sendTelegramMessage(chatId, "<b>Помощь Arcanum</b>\n\n1. Откройте личный кабинет.\n2. Активируйте тариф.\n3. Выберите своё устройство и следуйте инструкции.\n\nЖивая поддержка будет подключена перед запуском оплат."); }

async function sendMirrors(chatId: number, userId: string) {
  const mirrors = [siteUrl(), ...(process.env.SITE_MIRRORS || "").split(",")].map(x=>x.trim()).filter(Boolean);
  if (!mirrors.length) return sendTelegramMessage(chatId, "Резервная ссылка временно недоступна. Попробуйте позднее.");
  const raw=randomBytes(32).toString("base64url");
  await supabaseAdmin().from("telegram_login_tokens").insert({user_id:userId,token_hash:createHash("sha256").update(raw).digest("hex"),expires_at:new Date(Date.now()+5*60_000).toISOString()});
  await sendTelegramMessage(chatId, "Выберите доступную ссылку:", { inline_keyboard: mirrors.slice(0,3).map((mirror,index)=>[{text:index?`Зеркало ${index}`:"Основной сайт",url:`${mirror}/api/auth/telegram/consume?token=${raw}`}]) });
}
