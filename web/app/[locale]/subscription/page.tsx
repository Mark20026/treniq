"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  Clock,
  AlertTriangle,
  Sparkles,
  CreditCard,
  ArrowRight,
  Zap,
  Users,
  Gift,
  Shield,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionInfo {
  plan: string;
  status: string;
  trialStart: string | null;
  trialEnd: string | null;
  daysLeft: number;
  isTrial: boolean;
  isExpired: boolean;
  isActive: boolean;
}

export default function SubscriptionPage() {
  const t = useTranslations("Subscription");
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [upgrading, setUpgrading] = useState(false);

  const locale = pathname?.split("/")[1] || "hu";

  // 🔥 PÉNZNEM MEGHATÁROZÁSA A NYELV ALAPJÁN
  const getCurrencySymbol = () => {
    switch (locale) {
      case "hu":
        return "";
      case "sk":
        return "";
      case "en":
        return "";
      default:
        return "Ft";
    }
  };

  const currencySymbol = getCurrencySymbol();

  const plans = [
    {
      id: "starter",
      name: t("planStarter"),
      price: locale === "hu" ? "9.900" : "29",
      priceEur: "29",
      clients: t("planStarterClients"),
      description: t("planStarterDescription"),
      features: [
        t("planStarterFeature1"),
        t("planStarterFeature2"),
        t("planStarterFeature3"),
        t("planStarterFeature4"),
        t("planStarterFeature5"),
      ],
      popular: false,
    },
    {
      id: "growing",
      name: t("planGrowing"),
      price: locale === "hu" ? "19.900" : "59",
      priceEur: "59",
      clients: t("planGrowingClients"),
      description: t("planGrowingDescription"),
      features: [
        t("planGrowingFeature1"),
        t("planGrowingFeature2"),
        t("planGrowingFeature3"),
        t("planGrowingFeature4"),
        t("planGrowingFeature5"),
        t("planGrowingFeature6"),
      ],
      popular: true,
    },
    {
      id: "scaling",
      name: t("planScaling"),
      price: locale === "hu" ? "34.900" : "99",
      priceEur: "99",
      clients: t("planScalingClients"),
      description: t("planScalingDescription"),
      features: [
        t("planScalingFeature1"),
        t("planScalingFeature2"),
        t("planScalingFeature3"),
        t("planScalingFeature4"),
        t("planScalingFeature5"),
        t("planScalingFeature6"),
      ],
      popular: false,
    },
  ];

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    const { data: profile, error } = await supabase
      .from("coach_profiles")
      .select("plan, subscription_status, trial_start, trial_end")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Hiba:", error);
      setLoading(false);
      return;
    }

    if (profile) {
      const now = new Date();
      const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null;
      const isTrial = profile.subscription_status === "trial";
      const isActive = profile.subscription_status === "active";
      const isExpired = trialEnd ? now > trialEnd : false;
      const daysLeft = trialEnd
        ? Math.ceil(
            (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          )
        : 0;

      setSubscription({
        plan: profile.plan || "growing",
        status: profile.subscription_status || "trial",
        trialStart: profile.trial_start,
        trialEnd: profile.trial_end,
        daysLeft,
        isTrial,
        isExpired,
        isActive,
      });
    }

    setLoading(false);
  }

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t("notLoggedIn"));
        return;
      }

      const { error } = await supabase
        .from("coach_profiles")
        .update({
          plan: planId,
          subscription_status: "trial",
          trial_start: new Date().toISOString(),
          trial_end: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error(t("upgradeError") + error.message);
        return;
      }

      const planName = plans.find((p) => p.id === planId)?.name ?? planId;
      toast.success(t("upgradeSuccess", { planName }));
      fetchSubscription();
    } catch (error) {
      console.error("Hiba:", error);
      toast.error(t("upgradeGenericError"));
    } finally {
      setUpgrading(false);
    }
  };

  const currentPlanData = plans.find((p) => p.id === subscription?.plan);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50/50">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center p-6 pt-20 lg:pt-6">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-indigo-100/20 to-purple-100/10 rounded-full blur-[120px] pointer-events-none" />

      <Sidebar />

      <main className="flex-1 lg:ml-64 pt-20 lg:pt-6 relative z-10">
        <div className="max-w-5xl mx-auto p-4 sm:p-8 lg:p-12 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="h-9 w-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100/50 shadow-sm shrink-0">
                  <CreditCard className="h-4 w-4" />
                </div>
                {t("title")}
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {t("subtitle")}
              </p>
            </div>
          </div>

          {subscription && currentPlanData && (
            <Card
              className={cn(
                "border rounded-3xl overflow-hidden bg-white shadow-sm transition-all duration-300",
                subscription.isActive && "border-slate-200/80",
                subscription.isTrial &&
                  subscription.daysLeft <= 3 &&
                  "border-amber-200 bg-gradient-to-r from-white to-amber-50/10",
                subscription.isTrial &&
                  subscription.daysLeft > 3 &&
                  "border-indigo-100 bg-gradient-to-r from-white to-indigo-50/10",
                subscription.isExpired &&
                  "border-rose-200 bg-gradient-to-r from-white to-rose-50/10",
              )}
            >
              <CardContent className="p-5 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3 w-full md:w-auto">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t("currentMembership")}
                    </p>
                    {subscription.isActive && (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-[11px] font-bold rounded-lg shadow-sm">
                        <Check className="h-3 w-3 mr-1 stroke-[3]" />{" "}
                        {t("active")}
                      </Badge>
                    )}
                    {subscription.isTrial && (
                      <Badge
                        className={cn(
                          "border px-2.5 py-0.5 text-[11px] font-bold rounded-lg shadow-sm",
                          subscription.daysLeft <= 3
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-indigo-50 text-indigo-700 border-indigo-100",
                        )}
                      >
                        {subscription.daysLeft <= 3 ? (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        {t("trial")} ({subscription.daysLeft} {t("days")})
                      </Badge>
                    )}
                    {subscription.isExpired && (
                      <Badge className="bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 text-[11px] font-bold rounded-lg shadow-sm">
                        <AlertTriangle className="h-3 w-3 mr-1" />{" "}
                        {t("expired")}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {currentPlanData.name}
                    </h2>
                    <span className="text-sm font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                      {currentPlanData.clients}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium max-w-xl">
                    {subscription.isTrial &&
                      !subscription.isExpired &&
                      (subscription.daysLeft > 3
                        ? t("trialActiveLong")
                        : t("trialActiveShort"))}
                    {subscription.isExpired && t("expiredMessage")}
                    {subscription.isActive && t("activeMessage")}
                  </p>
                </div>

                {subscription.trialEnd && (
                  <div className="md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 shrink-0 flex flex-row md:flex-col justify-between md:justify-center gap-4 w-full md:w-auto">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center md:justify-end gap-1">
                        <Clock className="h-3 w-3" /> {t("expiryDate")}
                      </p>
                      <p className="text-sm sm:text-base font-black text-slate-800 mt-0.5">
                        {new Date(subscription.trialEnd).toLocaleDateString(
                          `${locale}-HU`,
                          { year: "numeric", month: "long", day: "numeric" },
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {t("managePlans")}
              </h2>
              <p className="text-xs font-medium text-slate-400 mt-1">
                {t("managePlansDescription")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-fuse">
              {plans.map((plan) => {
                const isCurrent = subscription?.plan === plan.id;
                const isDisabled = isCurrent || upgrading;

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "border bg-white transition-all duration-300 rounded-3xl overflow-hidden relative flex flex-col justify-between",
                      isCurrent
                        ? "border-indigo-600 shadow-[0_20px_40px_-15px_rgba(79,70,229,0.08)] ring-4 ring-indigo-50"
                        : "border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md",
                      plan.popular && !isCurrent && "lg:translate-y-[-2px]",
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1 shadow-sm z-10">
                        <Sparkles className="h-3 w-3" /> {t("mostPopular")}
                      </div>
                    )}

                    <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-black text-slate-950 tracking-tight">
                              {plan.name}
                            </h3>
                            {isCurrent && (
                              <CircleDot className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                            )}
                          </div>
                          <div className="inline-block bg-slate-50 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-100">
                            {plan.clients}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                          {plan.description}
                        </p>

                        <div className="pt-2 flex items-baseline">
                          <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            {plan.price}
                          </span>
                          <span className="text-sm font-bold text-slate-400 ml-1.5">
                            {currencySymbol} {t("perMonth")}
                          </span>
                        </div>

                        <div className="h-px bg-slate-100 my-4" />

                        <ul className="space-y-3.5">
                          {plan.features.map((feature, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-3 text-sm text-slate-600"
                            >
                              <div className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                              </div>
                              <span className="font-medium leading-normal">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-6">
                        <Button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={isDisabled}
                          className={cn(
                            "w-full h-12 rounded-xl font-bold text-sm transition-all duration-300",
                            isCurrent
                              ? "bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed shadow-inner"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100",
                          )}
                        >
                          {isCurrent ? (
                            t("currentPlan")
                          ) : upgrading ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            <span className="flex items-center justify-center gap-1.5">
                              {t("switchPlan")}{" "}
                              <ArrowRight className="h-4 w-4 opacity-80" />
                            </span>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-400 border-t border-slate-200/50 pt-8">
            <div className="flex items-center gap-2.5 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
              <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{t("securePayment")}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <span>{t("instantSwitch")}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
              <Users className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>{t("professionals")}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
              <Gift className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{t("noObligation")}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
