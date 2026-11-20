"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowRight,
  User,
  Mail,
  Phone,
  Target,
  Sparkles,
  Check,
  Loader2,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    gym_name: "",
    specialization: "",
    years_experience: "",
    bio: "",
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/hu/login");
      return;
    }

    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("onboarding_completed, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed) {
      router.push("/hu/dashboard");
      return;
    }

    if (profile?.full_name) {
      setFormData((prev) => ({ ...prev, full_name: profile.full_name }));
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Nincs bejelentkezve!");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("coach_profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone || null,
        gym_name: formData.gym_name || null,
        specialization: formData.specialization
          ? [formData.specialization]
          : [],
        years_experience: formData.years_experience
          ? parseInt(formData.years_experience)
          : null,
        bio: formData.bio || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Hiba: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Profil sikeresen elkészült!");
    router.push("/hu/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold border border-indigo-100/80">
            <Sparkles className="h-3.5 w-3.5" />
            Üdvözlünk a TRENIQ-en!
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Még pár lépés, és készen állsz
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Segíts megismerni téged, hogy a legjobb élményt nyújthassuk.
          </p>
        </div>

        <Card className="border-slate-200 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            {/* Lépésjelző */}
            <div className="flex items-center justify-between gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                      step >= s
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                        : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 transition-all duration-300",
                        step > s ? "bg-indigo-600" : "bg-slate-200",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-500" />
                    Személyes adatok
                  </h3>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Teljes neved *
                    </Label>
                    <Input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Kovács Péter"
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Telefonszám
                    </Label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+36 30 123 4567"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                    onClick={() => setStep(2)}
                  >
                    Tovább
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-500" />
                    Szakmai adatok
                  </h3>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Edzőterem / Stúdió neve
                    </Label>
                    <Input
                      name="gym_name"
                      value={formData.gym_name}
                      onChange={handleChange}
                      placeholder="Pl. Fitness Palace"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Szakterületed
                    </Label>
                    <Input
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="Pl. Erőemelés, Fogyás, Rehabilitáció"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Évek tapasztalata
                    </Label>
                    <Input
                      name="years_experience"
                      type="number"
                      value={formData.years_experience}
                      onChange={handleChange}
                      placeholder="Pl. 5"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl font-bold"
                      onClick={() => setStep(1)}
                    >
                      Vissza
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                      onClick={() => setStep(3)}
                    >
                      Tovább
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-500" />
                    Még egy lépés
                  </h3>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Rövid bemutatkozás
                    </Label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Mesélj magadról, a filozófiádról..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/30 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all text-sm outline-none resize-none"
                    />
                  </div>

                  <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-indigo-100 rounded-lg mt-0.5">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Gratulálunk! 🎉
                        </p>
                        <p className="text-xs text-slate-500">
                          Már csak egy kattintás, és elindulhatsz. Az első
                          klienseid hozzáadásával kezdheted.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl font-bold"
                      onClick={() => setStep(2)}
                    >
                      Vissza
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      ) : (
                        <>
                          Irány a dashboard
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/hu/dashboard")}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            Kihagyom, később kitöltöm →
          </button>
        </div>
      </div>
    </div>
  );
}
