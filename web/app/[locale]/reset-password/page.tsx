"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPassword");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const locale = pathname?.split("/")[1] || "hu";

  useEffect(() => {
    // Ellenőrizzük, hogy van-e érvényes access token a URL-ben
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Ha nincs session, de a URL-ben van token, akkor a Supabase automatikusan kezeli
      // Ha nincs session és nincs token, akkor átirányítjuk a login-ra
      if (!session) {
        const hasToken = window.location.hash.includes("access_token");
        if (!hasToken) {
          toast.error(t("invalidLink"));
          router.push(`/${locale}/login`);
        }
      }
    };

    checkSession();
  }, [router, locale]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      toast.success(t("success"));

      // 3 másodperc múlva átirányítjuk a login oldalra
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 3000);
    } catch (error: any) {
      console.error("Hiba a jelszó visszaállítása során:", error);
      setError(error.message || t("genericError"));
      toast.error(t("genericError"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-50/60 px-4 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none" />

        <Card className="w-full max-w-md bg-white border border-slate-100 shadow-[0_20px_50px_-12px_rgba(79,70,229,0.06)] rounded-[2.5rem] p-8 relative z-10">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {t("successTitle")}
              </h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {t("successDescription")}
              </p>
            </div>
            <Button
              onClick={() => router.push(`/${locale}/login`)}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              {t("backToLogin")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50/60 px-4 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e504_1px,transparent_1px),linear-gradient(to_bottom,#4f46e504_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <Card className="w-full max-w-md bg-white border border-slate-100 shadow-[0_20px_50px_-12px_rgba(79,70,229,0.06)] rounded-[2.5rem] p-4 relative z-10">
        <Link
          href={`/${locale}/login`}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors group"
          aria-label={t("backToLogin")}
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>

        <CardHeader className="text-center pt-6 pb-4 space-y-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {t("title")}
              </h1>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-bold text-slate-600 tracking-wide uppercase pl-0.5"
              >
                {t("newPassword")}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t("newPasswordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-12 px-4 rounded-xl border-slate-200 bg-slate-50/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all font-medium text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-bold text-slate-600 tracking-wide uppercase pl-0.5"
              >
                {t("confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="h-12 px-4 rounded-xl border-slate-200 bg-slate-50/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all font-medium text-slate-800"
              />
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98] group flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white/80" />
                    <span>{t("saving")}</span>
                  </>
                ) : (
                  <span>{t("resetPassword")}</span>
                )}
              </Button>
            </div>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-slate-400 select-none pt-2">
            <Lock className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {t("secureConnection")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
