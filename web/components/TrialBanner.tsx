"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { X, Clock } from "lucide-react";
import Link from "next/link";

export function TrialBanner() {
  const t = useTranslations("TrialBanner");
  const pathname = usePathname();
  const [trialInfo, setTrialInfo] = useState<{
    daysLeft: number;
    isExpired: boolean;
    isTrial: boolean;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const locale = pathname?.split("/")[1] || "hu";

  useEffect(() => {
    fetchTrialInfo();
  }, []);

  async function fetchTrialInfo() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("trial_end, subscription_status")
      .eq("id", user.id)
      .single();

    if (!profile) return;

    const now = new Date();
    const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null;
    const isTrial = profile.subscription_status === "trial";
    const isExpired = trialEnd ? now > trialEnd : false;
    const daysLeft = trialEnd
      ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    setTrialInfo({ daysLeft, isExpired, isTrial });
  }

  if (!trialInfo || !trialInfo.isTrial || !isVisible) return null;

  const { daysLeft } = trialInfo;

  // Normál emlékeztető (több mint 3 nap van hátra)
  if (daysLeft > 3) {
    return (
      <div className="w-full bg-indigo-50/90 border-b border-indigo-100 px-4 py-3 text-center text-xs sm:text-sm shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col xs:flex-row items-center justify-center gap-1.5 xs:gap-2">
          <span className="text-slate-600 font-medium text-center">
            🎉 {t("daysLeft", { days: daysLeft })}.{" "}
          </span>
          <Link
            href={`/${locale}/pricing`}
            className="text-indigo-600 font-bold hover:underline shrink-0 whitespace-nowrap"
          >
            {t("explorePlans")} →
          </Link>
        </div>
      </div>
    );
  }

  // Sürgős figyelmeztetés (3 vagy kevesebb nap van hátra)
  if (daysLeft <= 3 && daysLeft > 0) {
    return (
      <div className="w-full bg-amber-50/90 border-b border-amber-200 px-4 py-3 text-center text-xs sm:text-sm relative shadow-sm backdrop-blur-sm">
        {/* Konténer, ami jobb oldalon helyet hagy a bezáró gombnak, hogy ne takarja ki a szöveget */}
        <div className="max-w-7xl mx-auto pr-8 flex flex-col sm:flex-row items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-2 flex-wrap text-center">
            <Clock className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
            <span className="text-amber-700 font-bold tracking-tight">
              ⚠️ {t("daysLeftWarning", { days: daysLeft })}
            </span>
          </div>
          <Link
            href={`/${locale}/pricing`}
            className="text-amber-900 font-black hover:underline bg-amber-200/50 hover:bg-amber-200/80 px-2.5 py-0.5 rounded-lg transition-colors shrink-0"
          >
            {t("subscribeNow")}
          </Link>
        </div>

        {/* Bezáró gomb vertikálisan középre igazítva */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-100/50 rounded-lg transition-colors"
          title={t("close") || "Bezárás"}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return null;
}
