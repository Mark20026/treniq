"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Lock,
  ArrowLeft,
  UserPlus,
  Mail,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const t = useTranslations("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const locale = pathname?.split("/")[1] || "hu";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push(`/${locale}/dashboard`);
      }
    });
  }, [router, locale]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(t("loginError") + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from("coach_profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!profile) {
        const { error: insertError } = await supabase
          .from("coach_profiles")
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.email?.split("@")[0] || t("defaultCoachName"),
          });

        if (insertError) {
          console.error("Profil létrehozási hiba:", insertError);
          toast.error(t("profileCreateError"));
          setLoading(false);
          return;
        }
      }

      toast.success(t("loginSuccess"));
      router.push(`/${locale}/dashboard`);
    }
    setLoading(false);
  };

  const openResetDialog = () => {
    setResetEmail(email || "");
    setResetSuccess(false);
    setIsResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error(t("forgotPasswordEmailRequired"));
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/${locale}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetSuccess(true);
      toast.success(t("forgotPasswordSuccess"));

      setTimeout(() => {
        setIsResetDialogOpen(false);
        setResetSuccess(false);
      }, 3000);
    } catch (error: any) {
      toast.error(t("forgotPasswordError") + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50/60 px-4 py-12 overflow-hidden">
      {/* Finom, prémium háttérfények és rácsozat */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e504_1px,transparent_1px),linear-gradient(to_bottom,#4f46e504_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <Card className="w-full max-w-md bg-white border border-slate-100 shadow-[0_20px_50px_-12px_rgba(79,70,229,0.06)] rounded-[2.5rem] p-6 sm:p-8 relative z-10">
        {/* VISSZANAVIGÁCIÓ - Kivülre helyezve z-index-szel, hogy ne zavarja a fejlécet */}
        <div className="absolute top-6 left-6 z-20">
          <Link
            href={`/${locale}`}
            className="flex p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100/80 transition-all group"
            aria-label={t("backToHome")}
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Kártya Fejléc - Megnövelt felső padding, hogy ne ütközzön a vissza gombbal */}
        <CardHeader className="text-center pt-10 pb-6 space-y-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-150">
              <span className="text-white font-black text-xl select-none tracking-tighter">
                T
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                TRENIQ
              </h1>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t("titleSub")}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Kártya Tartalom - Levegősebb space-y-6 */}
        <CardContent className="space-y-6 p-0">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email beviteli mező */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-bold text-slate-500 tracking-wide uppercase pl-1"
              >
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 px-4 rounded-xl border-slate-200 bg-slate-50/40 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all font-medium text-slate-800 placeholder:text-slate-400/80"
              />
            </div>

            {/* Jelszó beviteli mező */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold text-slate-500 tracking-wide uppercase"
                >
                  {t("password")}
                </Label>
                <button
                  type="button"
                  onClick={openResetDialog}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {t("forgotPassword")}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-12 px-4 rounded-xl border-slate-200 bg-slate-50/40 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all font-medium text-slate-800 placeholder:text-slate-400/80"
              />
            </div>

            {/* Bejelentkezés Gomb */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98] group flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white/80" />
                    <span>{t("loading")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("loginButton")}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Elválasztó sáv */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="bg-white px-4 text-slate-400">{t("or")}</span>
            </div>
          </div>

          {/* Regisztrációs Gomb */}
          <Link href={`/${locale}/register`} className="w-full block">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200/60 transition-all duration-300 group flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 group-hover:scale-105 transition-all" />
              {t("registerButton")}
            </Button>
          </Link>

          {/* Biztonsági lábjegyzet */}
          <div className="flex items-center justify-center gap-1.5 text-slate-400 select-none pt-2">
            <Lock className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {t("secureConnection")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* JELSZÓ-VISSZAÁLLÍTÁS MODAL TÖKÉLETES TÁVOLSÁGOKKAL */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-[2rem] border-slate-100 p-6 sm:p-8 gap-0 overflow-hidden">
          {resetSuccess ? (
            <div className="py-8 flex flex-col items-center text-center gap-5">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm animate-bounce">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="space-y-2 px-2">
                <h3 className="font-black text-slate-900 text-xl tracking-tight">
                  {t("forgotPasswordSuccessTitle")}
                </h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  {t("forgotPasswordSuccessDescription")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <DialogHeader className="space-y-4 text-left">
                <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                    {t("forgotPasswordTitle")}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-medium text-slate-400 leading-relaxed">
                    {t("forgotPasswordDescription")}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="reset-email"
                    className="text-xs font-bold text-slate-500 tracking-wide uppercase pl-0.5"
                  >
                    {t("email")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="h-12 pl-11 pr-4 rounded-xl border-slate-200 bg-slate-50/40 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>
                <p className="text-[10px] font-semibold text-slate-400/85 leading-relaxed px-0.5">
                  {t("forgotPasswordHint")}
                </p>
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2.5 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsResetDialogOpen(false)}
                  className="w-full sm:w-auto h-11 font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading || !resetEmail}
                  className="w-full sm:w-auto h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      {t("sending")}
                    </>
                  ) : (
                    t("sendResetLink")
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
