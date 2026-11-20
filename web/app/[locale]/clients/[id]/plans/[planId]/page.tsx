"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Navbar";
import AddExerciseModal from "@/components/AddExerciseModal";
import ExercisesList from "@/components/ExerciseList";
import {
  Calendar,
  Dumbbell,
  Clock,
  Loader2,
  ChevronRight,
  Layout,
} from "lucide-react";
import Link from "next/link";

interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  weekly_frequency: number;
  start_date: string;
  end_date: string | null;
  status: string;
}

export default function WorkoutPlanDetailPage() {
  const t = useTranslations("WorkoutPlanDetail");
  const params = useParams();
  const pathname = usePathname();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const locale = pathname?.split("/")[1] || "hu";

  const fetchPlan = useCallback(async () => {
    const { data, error } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("id", params.planId)
      .single();

    if (!error && data) {
      setPlan(data);
    }
    setLoading(false);
  }, [params.planId]);

  useEffect(() => {
    void Promise.resolve().then(fetchPlan);
  }, [fetchPlan]);

  const handleDataRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const difficultyLabels: Record<string, { label: string; color: string }> = {
    beginner: {
      label: t("difficultyBeginner"),
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    intermediate: {
      label: t("difficultyIntermediate"),
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    advanced: {
      label: t("difficultyAdvanced"),
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50">
        <Sidebar />
        {/* 🔥 MEGOLDVA: Itt is lejjebb toljuk mobilon a betöltőképernyőt a navbar miatt */}
        <div className="flex-1 flex justify-center items-center p-4 pt-16 lg:pt-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 space-y-5 md:space-y-6">
          {/* Breadcrumb - finomabb margók mobilon */}
          <nav className="flex flex-wrap items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 md:mb-8">
            <Link
              href={`/${locale}/clients/${params.id}`}
              className="hover:text-indigo-600 transition-colors shrink-0"
            >
              {t("backToClient")}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-slate-900 truncate max-w-[180px] sm:max-w-none">
              {t("planDetails")}
            </span>
          </nav>

          <div className="flex flex-col gap-5 md:gap-8">
            {/* Fejléc kártya */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[1.25rem] md:rounded-[2.5rem] p-5 md:p-10 shadow-2xl shadow-slate-200">
              <Layout className="absolute -right-10 -bottom-10 h-36 w-36 md:h-64 md:w-64 text-white/[0.03] -rotate-12 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 md:p-2 bg-indigo-500/20 rounded-lg md:rounded-xl backdrop-blur-md">
                        <Dumbbell className="h-4 w-4 md:h-6 md:w-6 text-indigo-400" />
                      </div>
                      <span
                        className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-xl border ${difficultyLabels[plan.difficulty]?.color} border-none bg-white/10 text-white`}
                      >
                        {difficultyLabels[plan.difficulty]?.label}
                      </span>
                    </div>

                    <div>
                      <h1 className="text-xl md:text-4xl font-black text-white tracking-tight break-words">
                        {plan.name}
                      </h1>
                      {plan.description && (
                        <p className="text-slate-400 mt-1.5 text-xs md:text-sm font-medium max-w-2xl leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Időszak & Gyakoriság infók - Mobilon egymás melletti flexbox, szűk helyen oszlopos */}
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 border-t border-white/5 pt-4 lg:pt-0 lg:border-none">
                    <div className="bg-white/5 backdrop-blur-sm px-3.5 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl border border-white/5 flex-1 sm:flex-none">
                      <div className="flex items-center gap-1.5 text-indigo-400 mb-0.5 md:mb-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                          {t("period")}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm font-bold text-white whitespace-nowrap">
                        {new Date(plan.start_date).toLocaleDateString(
                          `${locale}-HU`,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                        {plan.end_date &&
                          ` — ${new Date(plan.end_date).toLocaleDateString(`${locale}-HU`, { month: "short", day: "numeric" })}`}
                      </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm px-3.5 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl border border-white/5 flex-1 sm:flex-none">
                      <div className="flex items-center gap-1.5 text-indigo-400 mb-0.5 md:mb-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                          {t("frequency")}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm font-bold text-white whitespace-nowrap">
                        {t("timesPerWeek", { count: plan.weekly_frequency })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gyakorlatok listája szekció - mobilon p-3 / p-4 belső margók, hogy több hely maradjon a tartalomnak */}
            <div className="bg-white rounded-[1.25rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm p-3.5 sm:p-6 md:p-8 lg:p-10">
              <ExercisesList
                key={refreshKey}
                workoutPlanId={plan.id}
                onAddClick={() => setIsExerciseModalOpen(true)}
                onRefresh={handleDataRefresh}
              />
            </div>
          </div>
        </div>
      </main>

      <AddExerciseModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        workoutPlanId={plan.id}
        workoutPlanName={plan.name}
        onExerciseAdded={handleDataRefresh}
      />
    </div>
  );
}
