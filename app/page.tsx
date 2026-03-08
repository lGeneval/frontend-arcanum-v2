import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { TelegramSection } from "@/components/telegram-section";
import { FeaturesSection } from "@/components/features-section";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";
import { CookieBanner } from "@/components/cookie-banner";
import { StarrySky } from "@/components/starry-sky";

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <StarrySky />
      <Header />
      <HeroSection />
      <TelegramSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
      <CookieBanner />
    </main>
  );
}
