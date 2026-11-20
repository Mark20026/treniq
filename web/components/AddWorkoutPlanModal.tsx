"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Calendar,
  Target,
  Dumbbell,
  LayoutList,
  Clock,
  Type,
  ChevronRight,
} from "lucide-react";

interface AddWorkoutPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  onPlanAdded: () => void;
}

export default function AddWorkoutPlanModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  onPlanAdded,
}: AddWorkoutPlanModalProps) {
  const t = useTranslations("AddWorkoutPlan");
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    difficulty: "beginner",
    weekly_frequency: "3",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });

  const locale = pathname?.split("/")[1] || "hu";

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
      toast.error(t("errorTitle"), { description: t("notLoggedIn") });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("workout_plans").insert([
      {
        coach_id: user.id,
        client_id: clientId,
        name: formData.name,
        description: formData.description || null,
        difficulty: formData.difficulty,
        weekly_frequency: parseInt(formData.weekly_frequency),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        status: "active",
      },
    ]);

    if (error) {
      toast.error(t("errorTitle"), { description: error.message });
    } else {
      toast.success(t("successTitle"), {
        description: t("successDescription"),
      });
      setFormData({
        name: "",
        description: "",
        difficulty: "beginner",
        weekly_frequency: "3",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
      });
      onClose();
      onPlanAdded();
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full sm:h-auto max-w-full sm:max-w-xl p-0 pt-16 sm:pt-0 border-none shadow-2xl sm:rounded-3xl overflow-hidden bg-white max-h-screen sm:max-h-[90vh] flex flex-col">
        {/* Kompaktabb fejléc mobilon */}
        <DialogHeader className="bg-slate-900 px-5 py-5 sm:px-8 sm:py-7 text-white shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-indigo-500/20 rounded-xl sm:rounded-2xl shrink-0">
              <LayoutList className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-black tracking-tight truncate">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs sm:text-sm font-medium truncate">
                {t("clientLabel")}:{" "}
                <span className="text-indigo-300 font-bold">{clientName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Görgethető tartalom görgetősávval, igazított térközökkel */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-8 flex-1 overflow-y-auto space-y-5 sm:space-y-6 custom-scrollbar flex flex-col justify-between sm:justify-start"
        >
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"
              >
                <Type className="h-3 w-3" /> {t("planName")} *
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder={t("planNamePlaceholder")}
                value={formData.name}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1"
              >
                {t("description")}
              </label>
              <textarea
                id="description"
                name="description"
                placeholder={t("descriptionPlaceholder")}
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2 truncate">
                  <Dumbbell className="h-3 w-3 shrink-0" /> {t("difficulty")}
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full h-11 px-3 sm:px-4 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="beginner">{t("difficultyBeginner")}</option>
                  <option value="intermediate">
                    {t("difficultyIntermediate")}
                  </option>
                  <option value="advanced">{t("difficultyAdvanced")}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2 truncate">
                  <Clock className="h-3 w-3 shrink-0" /> {t("frequency")}
                </label>
                <select
                  name="weekly_frequency"
                  value={formData.weekly_frequency}
                  onChange={handleChange}
                  className="w-full h-11 px-3 sm:px-4 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={num}>
                      {t("frequencyValue", { count: num })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2 truncate">
                  <Calendar className="h-3 w-3 shrink-0" /> {t("startDate")}
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  lang={locale}
                  className="w-full h-11 px-3 sm:px-4 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 truncate">
                  {t("endDate")}
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  lang={locale}
                  className="w-full h-11 px-3 sm:px-4 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Alsó akciógombok reszponzív elrendezése */}
          <div className="flex gap-3 pt-4 sm:pt-6 border-t border-slate-100 mt-auto sm:mt-0 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all text-center"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? t("creating") : t("create")}
              {!loading && <ChevronRight className="h-4 w-4 shrink-0" />}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
