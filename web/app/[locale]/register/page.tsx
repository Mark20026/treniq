"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Lock,
  Sparkles,
  Check,
  Shield,
  Zap,
  Users,
  Gift,
  ArrowLeft,
  CircleDot,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const t = useTranslations("Register");
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<"plan" | "account">("plan");
  const [selectedPlan, setSelectedPlan] = useState<string>("growing");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const locale = pathname?.split("/")[1] || "hu";

  const plans = [
    {
      id: "starter",
      name: t("planStarter"),
      price: "9.900",
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
      price: "19.900",
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
      price: "34.900",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            plan: selectedPlan,
            trial_ends: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        },
      });

      if (error) {
        console.error("❌ Auth hiba:", error);
        if (error.message.includes("already registered")) {
          toast.error(t("alreadyRegistered"));
        } else {
          toast.error(t("registerError") + error.message);
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        console.error("❌ Nincs felhasználó adat");
        toast.error(t("unknownError"));
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("coach_profiles")
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name:
            formData.fullName ||
            data.user.email?.split("@")[0] ||
            t("defaultCoachName"),
          plan: selectedPlan,
          trial_start: new Date().toISOString(),
          trial_end: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          subscription_status: "trial",
        });

      if (!profileError) {

        toast.success(t("registerSuccess"));
        router.push(`/${locale}/onboarding`);
        setLoading(false);
        return;
      }

      console.warn("⚠️ Profil létrehozási figyelmeztetés:", profileError);

      toast.success(t("registerSuccess"));
      router.push(`/${locale}/onboarding`);
    } catch (err: any) {
      console.error("❌ Váratlan hiba:", err);
      toast.error(t("unknownError") + err.message);
    }

    setLoading(false);
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlan) || plans[1];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 py-16 overflow-hidden relative">
      <div className="absolute top-[-25%] left-[-15%] w-[800px] h-[800px] bg-gradient-to-tr from-indigo-200/20 to-violet-200/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10 flex flex-col gap-10">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-5">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-black text-base tracking-tighter">
                T
              </span>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              TRENIQ
            </span>
          </Link>
          <Link
            href={`/${locale}`}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t("backToHome")}
          </Link>
        </div>

        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50/80 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold border border-indigo-100/50 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {t("trialBadge")}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {t("title")} <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t("titleHighlight")}
            </span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200/40 shadow-inner max-w-md w-full">
            <button
              onClick={() => setStep("plan")}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2",
                step === "plan"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <CircleDot
                className={cn(
                  "h-3.5 w-3.5",
                  step === "plan" ? "text-indigo-600" : "text-slate-400",
                )}
              />
              {t("stepPlan")}
            </button>
            <button
              onClick={() =>
                step === "account" || selectedPlan ? setStep("account") : null
              }
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2",
                step === "account"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <Lock
                className={cn(
                  "h-3.5 w-3.5",
                  step === "account" ? "text-indigo-600" : "text-slate-400",
                )}
              />
              {t("stepAccount")}
            </button>
          </div>
        </div>

        {step === "plan" ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "border transition-all duration-300 rounded-3xl overflow-hidden relative flex flex-col justify-between bg-white",
                      isSelected
                        ? "border-indigo-600 shadow-[0_20px_40px_-15px_rgba(79,70,229,0.12)] ring-4 ring-indigo-50"
                        : "border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md",
                      plan.popular && !isSelected && "md:translate-y-[-4px]",
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Sparkles className="h-3 w-3" />
                        {t("mostPopular")}
                      </div>
                    )}

                    <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-slate-950 tracking-tight">
                            {plan.name}
                          </h3>
                          <div className="inline-block bg-slate-50 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-100">
                            {plan.clients}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                          {plan.description}
                        </p>

                        <div className="pt-2 flex items-baseline">
                          <span className="text-4xl font-black text-slate-900 tracking-tight">
                            {plan.price}
                          </span>
                          <span className="text-sm font-bold text-slate-400 ml-1.5">
                            {t("perMonth")}
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

                      <div className="pt-6 space-y-4">
                        <Button
                          className={cn(
                            "w-full h-12 rounded-xl font-bold text-sm transition-all duration-300",
                            isSelected
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200",
                          )}
                          onClick={() => {
                            setSelectedPlan(plan.id);
                            setStep("account");
                          }}
                        >
                          {isSelected ? t("continueWithPlan") : t("selectPlan")}
                          <ArrowRight className="h-4 w-4 ml-1.5 opacity-80" />
                        </Button>

                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                          <Gift className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{t("trialPeriod")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="border-slate-200/80 shadow-2xl rounded-3xl overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-slate-50 via-indigo-50/20 to-purple-50/20 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-indigo-600/10 text-indigo-600 rounded-lg flex items-center justify-center font-black text-sm">
                    {selectedPlanData.name[0]}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t("selectedPlan")}
                    </p>
                    <p className="font-black text-sm text-slate-900">
                      {selectedPlanData.name} ({selectedPlanData.clients})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep("plan")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm"
                >
                  {t("modify")}
                </button>
              </div>

              <CardContent className="p-8 space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {t("createAccount")}
                  </h2>
                  <p className="text-xs font-medium text-slate-400">
                    {t("createAccountDescription")}
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="fullName"
                      className="text-xs font-bold text-slate-500 uppercase tracking-wide"
                    >
                      {t("fullName")}
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder={t("fullNamePlaceholder")}
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="h-12 px-4 rounded-xl border-slate-200 bg-slate-50/30 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-xs font-bold text-slate-500 uppercase tracking-wide"
                    >
                      {t("email")}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-12 px-4 rounded-xl border-slate-200 bg-slate-50/30 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="password"
                      className="text-xs font-bold text-slate-500 uppercase tracking-wide"
                    >
                      {t("password")}
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="h-12 px-4 rounded-xl border-slate-200 bg-slate-50/30 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all"
                    />
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium pt-0.5">
                      <Lock className="h-3 w-3 opacity-70" />
                      <span>{t("passwordHint")}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.99] mt-2"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {t("startTrial")} <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="h-px bg-slate-100 my-2" />

                <div className="flex flex-col gap-3 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    {t("alreadyMember")}{" "}
                    <Link
                      href={`/${locale}/login`}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      {t("loginLink")}
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[11px] sm:text-xs text-slate-400 font-semibold select-none border-t border-slate-200/50 pt-8">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
            <span>{t("securePayment")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
            <span>{t("trialPeriodShort")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500 stroke-[2.5]" />
            <span>{t("cancelAnytime")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500 stroke-[2.5]" />
            <span>{t("professionals")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
