import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import "./login.css";

const errors: Record<string, string> = {
  google_config: "Google-вход ещё не настроен на сервере.",
  google_expired: "Сессия входа истекла. Попробуйте ещё раз.",
  google_state: "Не удалось проверить безопасность входа. Попробуйте ещё раз.",
  google_exchange: "Google не подтвердил вход. Попробуйте ещё раз.",
  google_profile: "Google не передал подтверждённый email.",
  google_account: "Не удалось создать аккаунт Arcanum.",
  expired: "Ссылка Telegram истекла. Запросите новую в боте.",
  used: "Эта ссылка Telegram уже использована.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "arcanumvpnbot";
  const { error } = await searchParams;
  return <main className="authPage"><section className="authCard"><Link className="brand" href="/">ARCANUM</Link><span>ЛИЧНЫЙ КАБИНЕТ</span><h1>Войти в Arcanum</h1><p>Выберите удобный способ. Пароль создавать не нужно.</p>{error && <p className="authError">{errors[error] || "Не удалось выполнить вход. Попробуйте ещё раз."}</p>}<a className="button google" href="/api/auth/google"><b>G</b>Продолжить с Google</a><div className="authDivider"><span>или</span></div><a className="button primary" href={`https://t.me/${bot}?start=login`}>Продолжить в Telegram</a><small>Входя, вы соглашаетесь с условиями использования и политикой конфиденциальности.</small><Link href="/">Вернуться на главную</Link></section></main>;
}
