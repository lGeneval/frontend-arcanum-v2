"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const accepted = localStorage.getItem("cookies-accepted");
      if (!accepted) {
        setIsVisible(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookies-accepted", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-fade-in-up">
      <div className="relative rounded-2xl bg-card/95 backdrop-blur-xl border border-border p-6 shadow-2xl shadow-background/50">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
            <Cookie className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="text-foreground font-semibold mb-2">
              Мы используем cookies
            </h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Для улучшения работы сайта мы используем файлы cookie. Продолжая использовать сайт, вы соглашаетесь с нашей политикой конфиденциальности.
            </p>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleAccept}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
              >
                Принять
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsVisible(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Подробнее
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
