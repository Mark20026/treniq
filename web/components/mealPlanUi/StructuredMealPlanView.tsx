"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Dumbbell,
  Apple,
  Coffee,
  Sun,
  Moon,
  Utensils,
  ChefHat,
  Sparkles,
  Info,
  CalendarDays,
  Edit,
  Save,
  X,
  Trash2,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface MealEntry {
  id: string;
  day_of_week: number;
  meal_type: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
}

interface StructuredMealPlanViewProps {
  planId: string;
  onClose: () => void;
  isOpen: boolean;
  isTemplate?: boolean;
  onUpdate?: () => void;
}

export default function StructuredMealPlanView({
  planId,
  onClose,
  isOpen,
  isTemplate = false,
  onUpdate,
}: StructuredMealPlanViewProps) {
  const t = useTranslations("MealPlanView");
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [isStructured, setIsStructured] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedEntries, setEditedEntries] = useState<MealEntry[]>([]);
  const [newEntryMealType, setNewEntryMealType] = useState<string>("breakfast");

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    entryId: string;
    foodName: string;
  }>({ isOpen: false, entryId: "", foodName: "" });

  const mealIcons: Record<string, any> = {
    breakfast: Coffee,
    morning_snack: Apple,
    lunch: Utensils,
    afternoon_snack: Apple,
    dinner: Sun,
    evening_snack: Moon,
  };

  const mealLabels: Record<string, string> = {
    breakfast: t("mealBreakfast"),
    morning_snack: t("mealMorningSnack"),
    lunch: t("mealLunch"),
    afternoon_snack: t("mealAfternoonSnack"),
    dinner: t("mealDinner"),
    evening_snack: t("mealEveningSnack"),
  };

  const mealColors: Record<string, string> = {
    breakfast: "bg-amber-50/60 border-amber-100 text-amber-700",
    morning_snack: "bg-emerald-50/60 border-emerald-100 text-emerald-700",
    lunch: "bg-indigo-50/60 border-indigo-100 text-indigo-700",
    afternoon_snack: "bg-emerald-50/60 border-emerald-100 text-emerald-700",
    dinner: "bg-orange-50/60 border-orange-100 text-orange-700",
    evening_snack: "bg-slate-50/60 border-slate-100 text-slate-700",
  };

  const weekDays = [
    { id: 1, name: t("dayMonday"), short: t("dayMondayShort") },
    { id: 2, name: t("dayTuesday"), short: t("dayTuesdayShort") },
    { id: 3, name: t("dayWednesday"), short: t("dayWednesdayShort") },
    { id: 4, name: t("dayThursday"), short: t("dayThursdayShort") },
    { id: 5, name: t("dayFriday"), short: t("dayFridayShort") },
    { id: 6, name: t("daySaturday"), short: t("daySaturdayShort") },
    { id: 7, name: t("daySunday"), short: t("daySundayShort") },
  ];

  useEffect(() => {
    if (isOpen && planId) fetchData();
  }, [isOpen, planId]);

  async function fetchData() {
    setLoading(true);
    setIsEditing(false);

    if (isTemplate) {
      const { data, error } = await supabase
        .from("meal_plan_templates")
        .select("*")
        .eq("id", planId)
        .single();

      if (data) {
        setPlan(data);
        if (data.content && data.content.includes("**Reggeli**")) {
          setIsStructured(false);
        }
      }
      setLoading(false);
    } else {
      const [planRes, entriesRes] = await Promise.all([
        supabase.from("meal_plans").select("*").eq("id", planId).single(),
        supabase
          .from("daily_meal_entries")
          .select("*")
          .eq("meal_plan_id", planId)
          .order("order_index", { ascending: true }),
      ]);

      if (planRes.data) setPlan(planRes.data);
      if (entriesRes.data) {
        setEntries(entriesRes.data || []);
        setEditedEntries(entriesRes.data || []);
        setIsStructured(entriesRes.data.length > 0);
      }
      setLoading(false);
    }
  }

  const getEntriesByDayAndMeal = (day: number, mealType: string) => {
    const data = isEditing ? editedEntries : entries;
    return data.filter(
      (e) => e.day_of_week === day && e.meal_type === mealType,
    );
  };

  const formatMacro = (val: number) => {
    if (!val) return "0";
    return Number(val.toFixed(1)).toString();
  };

  const calculateDayTotals = (day: number) => {
    const data = isEditing ? editedEntries : entries;
    const dayEntries = data.filter((e) => e.day_of_week === day);
    return {
      calories: Math.round(
        dayEntries.reduce((sum, e) => sum + (e.calories || 0), 0),
      ),
      protein: formatMacro(
        dayEntries.reduce((sum, e) => sum + (e.protein || 0), 0),
      ),
      carbs: formatMacro(
        dayEntries.reduce((sum, e) => sum + (e.carbs || 0), 0),
      ),
      fat: formatMacro(dayEntries.reduce((sum, e) => sum + (e.fat || 0), 0)),
    };
  };

  const parseNotes = (notes: string) => {
    if (!notes) return { options: "", meal_notes: "" };

    let options = "";
    let meal_notes = "";

    const lines = notes.split("\n");
    for (const line of lines) {
      if (line.includes("Opciók:")) {
        options = line.replace("Opciók:", "").trim();
      } else if (line.includes("Megjegyzés:")) {
        meal_notes = line.replace("Megjegyzés:", "").trim();
      } else if (line.includes("🔹")) {
        options = line.replace("🔹 Opciók:", "").trim();
      } else if (line.includes("📝")) {
        meal_notes = line.replace("📝 Megjegyzés:", "").trim();
      }
    }

    return { options, meal_notes };
  };

  const activeTotals = calculateDayTotals(activeDay);
  const activeDayEntries = isEditing
    ? editedEntries.filter((e) => e.day_of_week === activeDay)
    : entries.filter((e) => e.day_of_week === activeDay);

  const startEditing = () => {
    setEditedEntries([...entries]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedEntries([...entries]);
    setIsEditing(false);
  };

  const updateEntry = (entryId: string, field: keyof MealEntry, value: any) => {
    setEditedEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const openDeleteModal = (entryId: string, foodName: string) => {
    setDeleteConfirm({
      isOpen: true,
      entryId,
      foodName,
    });
  };

  const handleConfirmDelete = () => {
    setEditedEntries((prev) =>
      prev.filter((entry) => entry.id !== deleteConfirm.entryId),
    );
    setDeleteConfirm({ isOpen: false, entryId: "", foodName: "" });
    toast.success(t("deleteSuccess"));
  };

  const addNewEntry = () => {
    const newEntry: MealEntry = {
      id: `new-${Date.now()}`,
      day_of_week: activeDay,
      meal_type: newEntryMealType,
      food_name: "",
      quantity: 0,
      unit: "g",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      notes: "",
    };
    setEditedEntries((prev) => [...prev, newEntry]);
    toast.success(t("addSuccess"));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const entriesToUpdate = editedEntries.filter(
        (e) => !e.id.startsWith("new-"),
      );
      for (const entry of entriesToUpdate) {
        const { error } = await supabase
          .from("daily_meal_entries")
          .update({
            food_name: entry.food_name,
            quantity: entry.quantity,
            unit: entry.unit,
            calories: entry.calories,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
            notes: entry.notes,
          })
          .eq("id", entry.id);

        if (error) throw error;
      }

      const newEntries = editedEntries.filter(
        (e) => e.id.startsWith("new-") && e.food_name,
      );
      for (const entry of newEntries) {
        const { error } = await supabase.from("daily_meal_entries").insert({
          meal_plan_id: planId,
          day_of_week: entry.day_of_week,
          meal_type: entry.meal_type,
          food_name: entry.food_name,
          quantity: entry.quantity,
          unit: entry.unit || "g",
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          notes: entry.notes,
        });

        if (error) throw error;
      }

      const oldIds = new Set(entries.map((e) => e.id));
      const newIds = new Set(editedEntries.map((e) => e.id));
      const deletedIds = [...oldIds].filter(
        (id) => !newIds.has(id) && !id.startsWith("new-"),
      );

      for (const id of deletedIds) {
        const { error } = await supabase
          .from("daily_meal_entries")
          .delete()
          .eq("id", id);

        if (error) throw error;
      }

      toast.success(t("saveSuccess"));
      setIsEditing(false);
      await fetchData();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error(t("saveError") + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border-none shadow-2xl flex flex-col items-center justify-center py-16 [&>button]:hidden">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
            <ChefHat className="h-5 w-5 text-indigo-600 absolute animate-pulse" />
          </div>
          <p className="text-slate-400 text-xs font-semibold mt-4 tracking-wider uppercase">
            {t("loading")}
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isStructured && plan?.content) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] overflow-y-auto p-0 border-none bg-slate-50 rounded-none sm:rounded-[2rem] shadow-2xl flex flex-col pt-16 sm:pt-0 [&>button]:hidden">
          <div className="bg-white p-6 border-b border-slate-100 shrink-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-indigo-600 shrink-0" />
                  <DialogTitle className="text-xl font-black text-slate-950 tracking-tight truncate">
                    {plan?.name}
                  </DialogTitle>
                </div>
                {plan?.description && (
                  <p className="text-slate-400 text-xs font-medium truncate">
                    {plan.description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {plan?.daily_calories && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-orange-100">
                  <Flame className="h-3.5 w-3.5" /> {plan.daily_calories} kcal
                </span>
                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-indigo-100">
                  <Dumbbell className="h-3.5 w-3.5" /> P: {plan.daily_protein}g
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-emerald-100">
                  🍚 {t("carbsShort")}: {plan.daily_carbs}g
                </span>
                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-amber-100">
                  🥑 {t("fatShort")}: {plan.daily_fat}g
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="prose prose-slate prose-sm max-w-none bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm leading-relaxed">
              <ReactMarkdown>{plan.content}</ReactMarkdown>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl w-[100vw] sm:w-[95vw] h-[100dvh] sm:h-auto sm:max-h-[85vh] p-0 gap-0 border-none bg-slate-50 overflow-hidden rounded-none sm:rounded-3xl shadow-2xl flex flex-col pt-16 sm:pt-0 [&>button]:hidden">
          <div className="bg-white px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0 space-y-0.5 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="p-1 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                    <ChefHat className="h-4 w-4" />
                  </div>
                  <DialogTitle className="text-base sm:text-lg font-black text-slate-950 tracking-tight truncate">
                    {plan?.name || t("mealPlan")}
                  </DialogTitle>
                  {isEditing && (
                    <span className="text-[9px] sm:text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                      {t("editing")}
                    </span>
                  )}
                </div>
                {plan?.description && (
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate pl-7">
                    {plan.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-100">
                {!isTemplate && (
                  <>
                    {isEditing ? (
                      <>
                        <button
                          onClick={cancelEditing}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title={t("cancel")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={saveChanges}
                          disabled={saving}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title={t("save")}
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={startEditing}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title={t("edit")}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                  </>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title={t("close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white px-4 sm:px-5 py-2.5 border-b border-slate-100 shrink-0 overflow-x-auto no-scrollbar">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 min-w-[340px] sm:min-w-0">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-1.5 sm:p-2 rounded-xl border border-orange-100/60 flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 bg-white rounded-lg shadow-sm text-orange-600 shrink-0">
                  <Flame className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] sm:text-[9px] font-bold text-orange-700/70 uppercase tracking-wider leading-none mb-0.5 truncate">
                    {t("kcalShort")}
                  </p>
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-none truncate">
                    {activeTotals.calories}
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-1.5 sm:p-2 rounded-xl border border-indigo-100/60 flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 bg-white rounded-lg shadow-sm text-indigo-600 shrink-0">
                  <Dumbbell className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] sm:text-[9px] font-bold text-indigo-700/70 uppercase tracking-wider leading-none mb-0.5 truncate">
                    {t("proteinShort")}
                  </p>
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-none truncate">
                    {activeTotals.protein}
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">
                      g
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-1.5 sm:p-2 rounded-xl border border-emerald-100/60 flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 bg-white rounded-lg shadow-sm text-sm leading-none shrink-0">
                  🍚
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] sm:text-[9px] font-bold text-emerald-700/70 uppercase tracking-wider leading-none mb-0.5 truncate">
                    {t("carbsShort")}
                  </p>
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-none truncate">
                    {activeTotals.carbs}
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">
                      g
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-1.5 sm:p-2 rounded-xl border border-amber-100/60 flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 bg-white rounded-lg shadow-sm text-sm leading-none shrink-0">
                  🥑
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] sm:text-[9px] font-bold text-amber-700/70 uppercase tracking-wider leading-none mb-0.5 truncate">
                    {t("fatShort")}
                  </p>
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-none truncate">
                    {activeTotals.fat}
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">
                      g
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white px-4 sm:px-5 py-2 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
              {weekDays.map((day) => {
                const isActive = activeDay === day.id;
                return (
                  <button
                    key={day.id}
                    onClick={() => setActiveDay(day.id)}
                    className={`flex flex-col items-center flex-1 min-w-[42px] py-1.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20 scale-105"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    <span
                      className={`text-[8px] font-black uppercase tracking-wider mb-0.5 ${isActive ? "text-indigo-400" : "text-slate-400"}`}
                    >
                      {day.short}
                    </span>
                    <span className="text-xs font-black">{day.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 class-no-scrollbar">
            {isEditing && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    {t("addNewFood")}:
                  </span>
                  <select
                    value={newEntryMealType}
                    onChange={(e) => setNewEntryMealType(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-full sm:w-auto"
                  >
                    {Object.entries(mealLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addNewEntry}
                  className="text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-xl w-full sm:w-auto"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t("addButton")}
                </Button>
              </div>
            )}

            {activeDayEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 my-4 bg-white border border-dashed border-slate-200 rounded-3xl shadow-sm min-h-[220px]">
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 mb-4 border border-slate-100">
                  <CalendarDays className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="text-slate-900 font-bold text-sm tracking-tight mb-1">
                  {t("emptyDay")}
                </h3>
                <p className="text-slate-400 text-xs font-medium max-w-[240px] leading-relaxed">
                  {isEditing ? t("emptyDayEdit") : t("emptyDayView")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(mealLabels).map(([mealType, label]) => {
                  const meals = getEntriesByDayAndMeal(activeDay, mealType);
                  if (meals.length === 0) return null;
                  const Icon = mealIcons[mealType];
                  const colorBadge =
                    mealColors[mealType] ||
                    "bg-slate-50 border-slate-100 text-slate-700";

                  return (
                    <div
                      key={mealType}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
                    >
                      <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg border text-xs flex items-center justify-center ${colorBadge}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">
                            {label}
                          </h3>
                        </div>
                        <span className="bg-indigo-50/60 text-indigo-700 font-black text-[10px] px-2 py-0.5 rounded-lg border border-indigo-100/50">
                          {Math.round(
                            meals.reduce(
                              (sum, m) => sum + (m.calories || 0),
                              0,
                            ),
                          )}{" "}
                          kcal
                        </span>
                      </div>

                      <div className="p-3 divide-y divide-slate-50">
                        {meals.map((meal) => {
                          const parsed = parseNotes(meal.notes || "");
                          const isNew = meal.id.startsWith("new-");

                          return (
                            <div
                              key={meal.id}
                              className={`py-3 first:pt-1 last:pb-1 space-y-2 ${isNew ? "bg-amber-50/30 rounded-lg px-2 -mx-2" : ""}`}
                            >
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={meal.food_name}
                                      onChange={(e) =>
                                        updateEntry(
                                          meal.id,
                                          "food_name",
                                          e.target.value,
                                        )
                                      }
                                      placeholder={t("foodNamePlaceholder")}
                                      className="flex-1 px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                                    />
                                    <button
                                      onClick={() =>
                                        openDeleteModal(meal.id, meal.food_name)
                                      }
                                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    <input
                                      type="number"
                                      value={meal.quantity || ""}
                                      onChange={(e) =>
                                        updateEntry(
                                          meal.id,
                                          "quantity",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      placeholder={t("qty")}
                                      className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                                    />
                                    <input
                                      type="text"
                                      value={meal.unit || "g"}
                                      onChange={(e) =>
                                        updateEntry(
                                          meal.id,
                                          "unit",
                                          e.target.value,
                                        )
                                      }
                                      placeholder={t("unit")}
                                      className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                                    />
                                    <input
                                      type="number"
                                      value={meal.calories || ""}
                                      onChange={(e) =>
                                        updateEntry(
                                          meal.id,
                                          "calories",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      placeholder={t("kcalShort")}
                                      className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white col-span-2 sm:col-span-1"
                                    />
                                    <input
                                      type="number"
                                      value={meal.protein || ""}
                                      onChange={(e) =>
                                        updateEntry(
                                          meal.id,
                                          "protein",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      placeholder={t("proteinShort")}
                                      className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                                    />
                                    <input
                                      type="number"
                                      value={meal.carbs || ""}
                                      onChange={(e) =>
                                        updateEntry(
                                          meal.id,
                                          "carbs",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      placeholder={t("carbsShort")}
                                      className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                      type="number"
                                      value={meal.fat || ""}
                                      onChange={(e) =>
                                        updateEntry(
                                          meal.id,
                                          "fat",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      placeholder={t("fatShort")}
                                      className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                                    />
                                    <input
                                      type="text"
                                      value={meal.notes || ""}
                                      onChange={(e) =>
                                        updateEntry(
                                          meal.id,
                                          "notes",
                                          e.target.value,
                                        )
                                      }
                                      placeholder={t("notesPlaceholder")}
                                      className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                      <h4 className="font-bold text-slate-900 text-sm leading-snug break-words">
                                        {meal.food_name}
                                      </h4>
                                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                        {meal.quantity} {meal.unit}
                                      </p>
                                    </div>
                                    <span className="bg-slate-900 text-white font-black text-[10px] px-2 py-0.5 rounded-md shrink-0">
                                      {Math.round(meal.calories)} kcal
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400">
                                    <span className="flex items-center gap-0.5 text-indigo-600">
                                      <Dumbbell className="h-3 w-3" />{" "}
                                      {t("proteinShort")}:{" "}
                                      {formatMacro(meal.protein)}g
                                    </span>
                                    <span className="flex items-center gap-0.5 text-emerald-600">
                                      🍚 {t("carbsShort")}:{" "}
                                      {formatMacro(meal.carbs)}g
                                    </span>
                                    <span className="flex items-center gap-0.5 text-amber-600">
                                      🥑 {t("fatShort")}:{" "}
                                      {formatMacro(meal.fat)}g
                                    </span>
                                  </div>

                                  {(parsed.options || parsed.meal_notes) && (
                                    <div className="pt-2 mt-1 space-y-1.5 border-t border-dashed border-slate-100">
                                      {parsed.options && (
                                        <div className="flex items-start gap-1.5 p-1.5 bg-amber-50/50 rounded-lg border border-amber-100/50 text-[11px]">
                                          <Sparkles className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                                          <span className="text-amber-800 font-medium break-words">
                                            <strong className="font-bold">
                                              {t("optionsLabel")}:
                                            </strong>{" "}
                                            {parsed.options}
                                          </span>
                                        </div>
                                      )}
                                      {parsed.meal_notes && (
                                        <div className="flex items-start gap-1.5 p-1.5 bg-blue-50/50 rounded-lg border border-blue-100/50 text-[11px]">
                                          <Info className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                                          <span className="text-blue-800 font-medium break-words">
                                            <strong className="font-bold">
                                              {t("notesLabel")}:
                                            </strong>{" "}
                                            {parsed.meal_notes}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) =>
          !open && setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <DialogContent className="max-w-sm w-[90vw] p-6 bg-white rounded-3xl border-none shadow-2xl flex flex-col items-center text-center gap-4 [&>button]:hidden">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl animate-bounce">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-base font-black text-slate-900 tracking-tight">
              {t("deleteConfirmTitle")}
            </DialogTitle>
            <p className="text-xs text-slate-400 font-medium leading-relaxed px-2">
              {t("deleteConfirmDescription", {
                foodName: deleteConfirm.foodName || t("unnamedFood"),
              })}
            </p>
          </div>

          <div className="flex w-full gap-2.5 pt-2">
            <button
              onClick={() =>
                setDeleteConfirm({ isOpen: false, entryId: "", foodName: "" })
              }
              className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all duration-200"
            >
              {t("deleteCancel")}
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/10 transition-all duration-200"
            >
              {t("deleteConfirm")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
