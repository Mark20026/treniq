"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  LogOut,
  Users,
  LayoutDashboard,
  MessageCircle,
  CalendarDays,
  User,
  Menu,
  X,
  Bell,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [locale, setLocale] = useState("hu");

  // Menü bezárása, ha útvonalat váltunk (mobilon rendkívül fontos!)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const currentLocale = pathname?.split("/")[1] || "hu";
    setLocale(currentLocale);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  const isActive = (href: string) => {
    if (href === `/${locale}`) return pathname === `/${locale}`;
    return pathname?.startsWith(href);
  };

  const menuItems = [
    {
      label: t("dashboard"),
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    { label: t("clientList"), href: `/${locale}/clients`, icon: Users },
    { label: t("calendar"), href: `/${locale}/calendar`, icon: CalendarDays },
    { label: t("messages"), href: `/${locale}/chat`, icon: MessageCircle },
    { label: t("notifications"), href: `/${locale}/notifications`, icon: Bell },
    { label: t("profile"), href: `/${locale}/profile`, icon: User },
    {
      label: t("subscription"),
      href: `/${locale}/subscription`,
      icon: CreditCard,
    },
  ];

  return (
    <>
      {/* --- MOBIL FEJLÉC (Látható: lg-ig, felette rejtett) --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-[60] shadow-sm">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
            <span className="text-white font-black text-sm tracking-tighter">
              T
            </span>
          </div>
          <span className="font-black text-slate-900 tracking-tight text-lg">
            TRENIQ
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Mobil Gyors-értesítések gomb az extra kényelemért */}
          <Link
            href={`/${locale}/notifications`}
            className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors relative"
          >
            <Bell className="h-5 w-5" />
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors active:scale-95"
            aria-label="Menü megnyitása"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* --- OLDALSÁV / ASZTALI ÉS MOBIL PANNELES MENÜ --- */}
      <aside
        className={cn(
          // Alapértelmezetten rögzített bal oldali panel, mobilokon eltolva (-translate-x-full)
          "fixed left-0 top-0 h-screen w-64 border-r border-slate-100 bg-white flex flex-col z-[80] transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-[4px_0_24px_rgba(0,0,0,0.015)]",
          // Mobilon fentről megnyitjuk a mobil fejléc magasságával (pt-16), így nem takarja ki a címsort és a logót
          "pt-16 lg:pt-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo szekció (Asztali nézetben jelenik csak meg, mobilon a fix fejléc váltja ki) */}
        <div className="hidden lg:flex p-6 items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-black text-xl tracking-tighter">
                T
              </span>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              TRENIQ
            </span>
          </Link>
        </div>

        {/* Görgőscsatorna (Scrollable Navigation) a reszponzivitásért */}
        <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto scrollbar-none">
          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 select-none">
            {t("menu")}
          </p>
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mb-1 active:scale-[0.98]",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        active ? "text-indigo-600" : "text-slate-400",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {active && (
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Alsó szekció (Nyelvválasztó és Kijelentkezés) */}
        <div className="p-4 border-t border-slate-150 space-y-3 bg-slate-50/60 mt-auto shrink-0">
          <div className="flex items-center justify-center">
            <LanguageSwitcher />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50/80 hover:text-rose-600 transition-all active:scale-[0.98] group"
          >
            <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            <span className="truncate">{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* --- MOBIL MENÜ HÁTTÉR (Overlay homályosítással és áttűnéssel) --- */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-[70] lg:hidden transition-all duration-300 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
