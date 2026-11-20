"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, LogIn, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  id: string;
}

interface NavbarProps {
  isScrolled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Funkciók", id: "features" },
  { label: "Vélemények", id: "testimonials" },
  { label: "Árazás", id: "pricing" },
  { label: "GYIK", id: "faq" },
];

const LANGUAGES = [
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
];

export function Navbar({ isScrolled }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const langMenuRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    closeMobileMenu();
  };

  const switchLanguage = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const segments = currentPath.split("/");
    const localePattern = /^(hu|en|sk)$/;
    if (segments.length > 1 && localePattern.test(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join("/");
    window.location.href = newPath;
    setIsLangMenuOpen(false);
    closeMobileMenu();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeLangDetails =
    LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
          isScrolled
            ? "bg-white/80 backdrop-blur-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border-b border-slate-200/50 py-3"
            : "bg-transparent py-5",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none"
            >
              <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-300">
                <span className="text-white font-black text-base tracking-tighter">
                  T
                </span>
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight bg-clip-text group-hover:text-slate-700 transition-colors duration-300">
                TRENIQ
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="px-4 py-2 rounded-xl hover:text-indigo-600 hover:bg-slate-50/80 transition-all duration-300 relative group"
                >
                  {item.label}
                  <span className="absolute bottom-1.5 left-4 right-4 h-0.5 bg-indigo-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </button>
              ))}

              <div className="h-5 w-px bg-slate-200 mx-3" />

              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-bold transition-all duration-300 active:scale-95",
                    isLangMenuOpen && "bg-slate-50 text-indigo-600",
                  )}
                >
                  <span className="text-base leading-none">
                    {activeLangDetails.flag}
                  </span>
                  <span className="uppercase text-xs tracking-wider">
                    {activeLangDetails.code}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-300 opacity-60",
                      isLangMenuOpen && "rotate-180 text-indigo-600",
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "absolute top-full right-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] p-1.5 transition-all duration-300 origin-top-right z-50",
                    isLangMenuOpen
                      ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-95 -translate-y-2 pointer-events-none",
                  )}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLanguage(lang.code)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all duration-200",
                        locale === lang.code
                          ? "bg-indigo-50/80 text-indigo-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      <span className="text-base leading-none">
                        {lang.flag}
                      </span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-5 w-px bg-slate-200 mx-3" />

              <Link href={`/${locale}/login`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl px-4 transition-all duration-300"
                >
                  <LogIn className="h-4 w-4 mr-1.5 opacity-75" />
                  Belépés
                </Button>
              </Link>

              <Link href={`/${locale}/register`}>
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all duration-300 gap-1"
                >
                  Próbáld ki
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </nav>

            <button
              onClick={toggleMobileMenu}
              aria-label={
                isMobileMenuOpen ? "Menü bezárása" : "Menü megnyitása"
              }
              className="md:hidden p-2.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100/80 active:scale-95 transition-all duration-200 z-50 relative"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 stroke-[2.5]" />
              ) : (
                <Menu className="h-5 w-5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 md:hidden transition-opacity duration-300",
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={closeMobileMenu}
      />

      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 w-[280px] bg-white z-40 md:hidden shadow-2xl border-l border-slate-100 p-6 pt-24 transition-transform duration-300 ease-out transform flex flex-col justify-between",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav className="flex flex-col space-y-2">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 px-3 mb-2">
            Navigáció
          </p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="w-full text-left px-4 py-3 text-base font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all duration-200"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="px-3 space-y-2">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">
              Nyelv / Language
            </p>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    switchLanguage(lang.code);
                    closeMobileMenu();
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 gap-1",
                    locale === lang.code
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-100 font-extrabold"
                      : "text-slate-500 font-medium hover:text-slate-900",
                  )}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span className="text-[10px] uppercase tracking-wider">
                    {lang.code}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href={`/${locale}/login`}
              className="w-full block"
              onClick={closeMobileMenu}
            >
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Belépés
              </Button>
            </Link>
            <Link
              href={`/${locale}/register`}
              className="w-full block"
              onClick={closeMobileMenu}
            >
              <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">
                Ingyenes regisztráció
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
