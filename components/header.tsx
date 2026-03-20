"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Globe } from "lucide-react";
import { AnimatedLogo } from "./animated-logo";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <AnimatedLogo size={44} />
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent tracking-wider" style={{ fontFamily: "serif" }}>
            Arkanum
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollTo('#download')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative group"
          >
            Скачать
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300" />
          </button>
          <button
            onClick={() => scrollTo('#about')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative group"
          >
            О нас
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300" />
          </button>
          <button
            onClick={() => scrollTo('#support')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative group"
          >
            Помощь и поддержка
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300" />
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Globe className="w-4 h-4" />
            RU
            <ChevronDown className="w-3 h-3" />
          </button>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 border border-purple-400/20">
              Войти
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border transition-all duration-500 overflow-hidden ${
          isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
          <button onClick={() => { scrollTo('#download'); setIsMobileMenuOpen(false); }} className="text-left text-foreground py-2 hover:text-purple-400 transition-colors">
            Скачать
          </button>
          <button onClick={() => { scrollTo('#about'); setIsMobileMenuOpen(false); }} className="text-left text-foreground py-2 hover:text-purple-400 transition-colors">
            О нас
          </button>
          <button onClick={() => { scrollTo('#support'); setIsMobileMenuOpen(false); }} className="text-left text-foreground py-2 hover:text-purple-400 transition-colors">
            Помощь и поддержка
          </button>
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 mt-4">
              Войти
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}