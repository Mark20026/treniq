"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    const segments = pathname.split("/");
    // Megnézzük, hogy a második szegmens egy 2 betűs nyelvi kód-e
    if (segments.length > 1 && segments[1].length === 2) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }

    const newPath = segments.join("/");
    setIsOpen(false);

    // Lágy kliensoldali átirányítás villogás nélkül
    router.push(newPath);
  };

  // Kívülre kattintás kezelése a menü bezárásához
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={menuRef}>
      {/* --- DESKTOP NÉZET: Elegáns Dropup menü (Felfelé és jobbra nyílik) --- */}
      <div className="hidden lg:block">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200/60 bg-white text-slate-700 font-bold text-sm shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]",
            isOpen && "border-indigo-200 ring-4 ring-indigo-50 text-indigo-600",
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base leading-none">{activeLang.flag}</span>
            <span className="uppercase text-xs tracking-wider font-extrabold">
              {activeLang.code}
            </span>
          </div>
          <ChevronUp
            className={cn(
              "h-4 w-4 transition-transform duration-300 opacity-60",
              isOpen && "rotate-180 text-indigo-600 opacity-100",
            )}
          />
        </button>

        {/* Felfelé nyíló panel (balra zárt, de jobbra szélesedő/nyíló elhelyezkedés) */}
        <div
          className={cn(
            "absolute bottom-full left-0 mb-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.12)] p-1.5 transition-all duration-300 origin-bottom-left z-50",
            isOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 translate-y-2 pointer-events-none",
          )}
        >
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Nyelvválasztás
          </p>
          {LANGUAGES.map((lang) => {
            const isSelected = locale === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => switchLanguage(lang.code)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all duration-150",
                  isSelected
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 stroke-[3] text-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- MOBIL NÉZET: Egymás melletti tabletták a szűkös hely miatt --- */}
      <div className="block lg:hidden w-full">
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/40">
          {LANGUAGES.map((lang) => {
            const isSelected = locale === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => switchLanguage(lang.code)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 gap-1",
                  isSelected
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50 font-black"
                    : "text-slate-500 font-bold hover:text-slate-900",
                )}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="text-[10px] uppercase tracking-wider">
                  {lang.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
