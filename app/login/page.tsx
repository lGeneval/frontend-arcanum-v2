import Link from "next/link";

export default function LoginPage() {
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "arcanumvpnbot";
  return <main className="authPage"><section className="authCard"><Link className="brand" href="/">ARCANUM</Link><span>ЛИЧНЫЙ КАБИНЕТ</span><h1>Вход через Telegram</h1><p>Нажмите кнопку, затем подтвердите вход в боте. Пароль создавать не нужно.</p><a className="button primary" href={`https://t.me/${bot}?start=login`}>Продолжить в Telegram</a><Link href="/">Вернуться на главную</Link></section></main>;
}
