"use client";
import { Languages, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function Preferences({lang="ru"}:{lang?:"ru"|"en"}) {
  const [theme,setTheme]=useState<"dark"|"light">("dark");
  useEffect(()=>{const value=(localStorage.getItem("arcanum-theme")||"dark") as "dark"|"light";setTheme(value);document.documentElement.dataset.theme=value},[]);
  const toggleTheme=()=>{const next=theme==="dark"?"light":"dark";localStorage.setItem("arcanum-theme",next);document.cookie=`arcanum_theme=${next}; path=/; max-age=31536000; samesite=lax`;document.documentElement.dataset.theme=next;setTheme(next)};
  const toggleLang=()=>{const next=lang==="ru"?"en":"ru";localStorage.setItem("arcanum-lang",next);document.cookie=`arcanum_lang=${next}; path=/; max-age=31536000; samesite=lax`;location.reload()};
  return <div className="preferences"><button type="button" aria-label="Сменить тему" onClick={toggleTheme}>{theme==="dark"?<Sun/>:<Moon/>}</button><button type="button" aria-label="Сменить язык" onClick={toggleLang}><Languages/><span>{lang.toUpperCase()}</span></button></div>;
}
