import type { Metadata } from "next";
import "./globals.css";
import "./home-overrides.css";

export const metadata: Metadata = {
  title: "Arcanum — интернет без лишних границ",
  description: "Один доступ для телефона, компьютера и семьи. Управление через Telegram.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
