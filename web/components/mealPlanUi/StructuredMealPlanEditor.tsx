"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Utensils,
  Flame,
  Dumbbell,
  Apple,
  Coffee,
  Sun,
  Moon,
  Loader2,
  ChefHat,
  Copy,
  ClipboardCopy,
  X,
  FileSpreadsheet,
  ShoppingCart,
  Pencil,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ExcelImportModal from "./ExcelImportModal";

interface MealEntry {
  id?: string;
  food_name: string;
  quantity: number | null;
  unit: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  notes: string;
  options?: string;
  meal_notes?: string;
}

interface DayMeals {
  day: number;
  dayName: string;
  breakfast: MealEntry[];
  morning_snack: MealEntry[];
  lunch: MealEntry[];
  afternoon_snack: MealEntry[];
  dinner: MealEntry[];
  evening_snack: MealEntry[];
}

interface TemplateToLoad {
  name?: string;
  content: string;
  daily_calories?: number | null;
}

interface StructuredMealPlanEditorProps {
  clientId: string;
  clientName: string;
  onSave: () => void;
  onClose: () => void;
  isOpen: boolean;
  templateToLoad?: TemplateToLoad | null;
}

export default function StructuredMealPlanEditor({
  clientId,
  clientName,
  onSave,
  onClose,
  isOpen,
  templateToLoad = null,
}: StructuredMealPlanEditorProps) {
  const t = useTranslations("MealPlanEditor");
  const [loading, setLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [planName, setPlanName] = useState("");
  const [dailyCalories, setDailyCalories] = useState<number | null>(null);
  const [copySourceDay, setCopySourceDay] = useState<number | null>(null);
  const [showCopyTooltip, setShowCopyTooltip] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [shoppingList, setShoppingList] = useState("");
  const [expandedMeals, setExpandedMeals] = useState<{
    [key: string]: boolean;
  }>({});

  const mealTypes = useMemo(
    () => [
      {
        id: "breakfast",
        label: t("mealBreakfast"),
        icon: Coffee,
        color: "bg-amber-50 text-amber-600",
        borderColor: "border-amber-200",
      },
      {
        id: "morning_snack",
        label: t("mealMorningSnack"),
        icon: Apple,
        color: "bg-emerald-50 text-emerald-600",
        borderColor: "border-emerald-200",
      },
      {
        id: "lunch",
        label: t("mealLunch"),
        icon: Utensils,
        color: "bg-indigo-50 text-indigo-600",
        borderColor: "border-indigo-200",
      },
      {
        id: "afternoon_snack",
        label: t("mealAfternoonSnack"),
        icon: Apple,
        color: "bg-emerald-50 text-emerald-600",
        borderColor: "border-emerald-200",
      },
      {
        id: "dinner",
        label: t("mealDinner"),
        icon: Sun,
        color: "bg-orange-50 text-orange-600",
        borderColor: "border-orange-200",
      },
      {
        id: "evening_snack",
        label: t("mealEveningSnack"),
        icon: Moon,
        color: "bg-slate-50 text-slate-600",
        borderColor: "border-slate-200",
      },
    ],
    [t],
  );

  const weekDays = useMemo(
    () => [
      { id: 1, name: t("dayMonday") },
      { id: 2, name: t("dayTuesday") },
      { id: 3, name: t("dayWednesday") },
      { id: 4, name: t("dayThursday") },
      { id: 5, name: t("dayFriday") },
      { id: 6, name: t("daySaturday") },
      { id: 7, name: t("daySunday") },
    ],
    [t],
  );

  const labelToMealId = useMemo(() => {
    return mealTypes.reduce(
      (acc, m) => ({ ...acc, [m.label]: m.id }),
      {} as Record<string, string>,
    );
  }, [mealTypes]);

  const createEmptyDays = useCallback((): DayMeals[] => {
    return weekDays.map((day) => ({
      day: day.id,
      dayName: day.name,
      breakfast: [],
      morning_snack: [],
      lunch: [],
      afternoon_snack: [],
      dinner: [],
      evening_snack: [],
    }));
  }, [weekDays]);

  const [days, setDays] = useState<DayMeals[]>(() => createEmptyDays());

  const parseTemplateContent = useCallback(
    (
      content: string,
    ): {
      days: DayMeals[];
      shoppingList: string;
    } => {
      const parsedDays = createEmptyDays();
      const lines = content.split("\n");

      let currentDayIndex: number | null = null;
      let currentMealKey: keyof DayMeals | null = null;
      let lastItem: MealEntry | null = null;
      let inShoppingSection = false;
      const shoppingListLines: string[] = [];

      for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("## ")) {
          const header = trimmed.replace(/^##\s*/, "").trim();

          if (header.includes(t("shoppingListTitle"))) {
            inShoppingSection = true;
            currentDayIndex = null;
            currentMealKey = null;
            continue;
          }

          if (
            header.includes(t("optionsTitle")) ||
            header.includes(t("notesTitle"))
          ) {
            inShoppingSection = false;
            currentDayIndex = null;
            currentMealKey = null;
            continue;
          }

          inShoppingSection = false;
          const dayId = weekDays.find((d) => d.name === header)?.id;
          currentDayIndex = dayId ? dayId - 1 : null;
          currentMealKey = null;
          continue;
        }

        if (trimmed.startsWith("### ")) {
          const label = trimmed.replace(/^###\s*/, "").trim();
          const mealId = labelToMealId[label];
          currentMealKey = mealId ? (mealId as keyof DayMeals) : null;
          continue;
        }

        if (trimmed === "---") {
          continue;
        }

        if (inShoppingSection) {
          shoppingListLines.push(trimmed.replace(/^-\s*/, ""));
          continue;
        }

        if (/^-\s*Opciók:/i.test(trimmed) && lastItem) {
          lastItem.options = trimmed.replace(/^-\s*Opciók:\s*/i, "").trim();
          continue;
        }
        if (/^-\s*Megjegyzés:/i.test(trimmed) && lastItem) {
          lastItem.meal_notes = trimmed
            .replace(/^-\s*Megjegyzés:\s*/i, "")
            .trim();
          continue;
        }

        if (
          trimmed.startsWith("- ") &&
          currentDayIndex !== null &&
          currentMealKey
        ) {
          const itemText = trimmed.slice(2).trim();

          let namePart = itemText;
          let restPart = "";
          const dashIdx = itemText.indexOf(" - ");
          if (dashIdx !== -1) {
            namePart = itemText.slice(0, dashIdx);
            restPart = itemText.slice(dashIdx + 3);
          }

          const item: MealEntry = {
            food_name: "",
            quantity: null,
            unit: "g",
            calories: null,
            protein: null,
            carbs: null,
            fat: null,
            notes: "",
            options: "",
            meal_notes: "",
          };

          const qtyMatch = namePart.match(
            /^(.*?)\s*\(([\d.,]+)\s*([a-zA-Zá-űÁ-Ű]+)\)\s*$/,
          );
          if (qtyMatch) {
            item.food_name = qtyMatch[1].trim();
            item.quantity = parseFloat(qtyMatch[2].replace(",", "."));
            item.unit = qtyMatch[3];
          } else {
            item.food_name = namePart.trim();
          }

          if (restPart) {
            const kcalMatch = restPart.match(/([\d.,]+)\s*kcal/i);
            if (kcalMatch)
              item.calories = parseFloat(kcalMatch[1].replace(",", "."));

            const pMatch = restPart.match(/([\d.,]+)\s*g\s*P\b/i);
            if (pMatch) item.protein = parseFloat(pMatch[1].replace(",", "."));

            const szMatch = restPart.match(/([\d.,]+)\s*g\s*Sz\b/i);
            if (szMatch) item.carbs = parseFloat(szMatch[1].replace(",", "."));

            const zsMatch = restPart.match(/([\d.,]+)\s*g\s*Zs\b/i);
            if (zsMatch) item.fat = parseFloat(zsMatch[1].replace(",", "."));
          }

          (parsedDays[currentDayIndex][currentMealKey] as MealEntry[]).push(
            item,
          );
          lastItem = item;
          continue;
        }
      }

      return { days: parsedDays, shoppingList: shoppingListLines.join("\n") };
    },
    [createEmptyDays, weekDays, labelToMealId, t],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (templateToLoad) {
      const parsed = parseTemplateContent(templateToLoad.content);
      setDays(parsed.days);
      setShoppingList(parsed.shoppingList);
      setPlanName(
        templateToLoad.name
          ? templateToLoad.name.replace(/\s*\(sablon\)\s*$/i, "")
          : "",
      );
      setDailyCalories(templateToLoad.daily_calories ?? null);
      toast.success(t("templateLoaded"));
    } else {
      setDays(createEmptyDays());
      setShoppingList("");
      setPlanName("");
      setDailyCalories(null);
    }

    setActiveTab("1");
    setCopySourceDay(null);
    setExpandedMeals({});
  }, [isOpen, templateToLoad, parseTemplateContent, createEmptyDays, t]);

  const toggleMealExpand = (dayIndex: number, mealType: string) => {
    const key = `${dayIndex}-${mealType}`;
    setExpandedMeals((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const addFoodItem = (dayIndex: number, mealType: string) => {
    const newDays = [...days];
    (newDays[dayIndex][mealType as keyof DayMeals] as MealEntry[]).push({
      food_name: "",
      quantity: null,
      unit: "g",
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      notes: "",
      options: "",
      meal_notes: "",
    });
    setDays(newDays);

    const key = `${dayIndex}-${mealType}`;
    setExpandedMeals((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  const updateFoodItem = (
    dayIndex: number,
    mealType: string,
    itemIndex: number,
    field: keyof MealEntry,
    value: any,
  ) => {
    const newDays = [...days];
    const items = newDays[dayIndex][mealType as keyof DayMeals] as MealEntry[];

    if (
      field === "protein" ||
      field === "carbs" ||
      field === "fat" ||
      field === "quantity"
    ) {
      if (value !== null && !isNaN(value)) {
        value = Math.round(value * 100) / 100;
      }
    }

    (items[itemIndex] as any)[field] = value;
    setDays(newDays);
  };

  const removeFoodItem = (
    dayIndex: number,
    mealType: string,
    itemIndex: number,
  ) => {
    const newDays = [...days];
    const items = newDays[dayIndex][mealType as keyof DayMeals] as MealEntry[];
    items.splice(itemIndex, 1);
    setDays(newDays);
  };

  const copyDay = (sourceDayIndex: number) => {
    setCopySourceDay(sourceDayIndex);
    setShowCopyTooltip(false);
    toast.success(t("copySuccess", { dayName: days[sourceDayIndex].dayName }), {
      description: t("copyDescription"),
      duration: 3000,
    });
  };

  const pasteDay = (targetDayIndex: number) => {
    if (copySourceDay === null) {
      toast.error(t("pasteError"));
      return;
    }

    const newDays = [...days];
    const sourceDay = days[copySourceDay];
    const targetDay = { ...newDays[targetDayIndex] };

    mealTypes.forEach((meal) => {
      const sourceMeals = sourceDay[meal.id as Exclude<keyof DayMeals, "day" | "dayName">] as MealEntry[];
      targetDay[meal.id as Exclude<keyof DayMeals, "day" | "dayName">] = sourceMeals.map((item) => ({
        ...item,
        options: item.options || "",
        meal_notes: item.meal_notes || "",
      }));
    });

    newDays[targetDayIndex] = targetDay;
    setDays(newDays);
    toast.success(t("pasteSuccess", { dayName: days[targetDayIndex].dayName }));
    setCopySourceDay(null);
  };

  const clearCopySource = () => {
    setCopySourceDay(null);
    toast.info(t("copyCleared"));
  };

  const handleImport = (
    importedDays: DayMeals[],
    shoppingListText?: string,
  ) => {
    setDays(importedDays);
    if (shoppingListText) {
      setShoppingList(shoppingListText);
      const itemCount = shoppingListText
        .split("\n")
        .filter((item) => item.trim()).length;
      toast.success(t("importSuccess", { count: itemCount }));
    } else {
      toast.success(t("importSuccessNoList"));
    }
  };

  const calculateDayTotals = (day: DayMeals) => {
    let calories = 0,
      protein = 0,
      carbs = 0,
      fat = 0;
    mealTypes.forEach((meal) => {
      const meals = day[meal.id as Exclude<keyof DayMeals, "day" | "dayName">] as MealEntry[];
      meals.forEach((item) => {
        calories += item.calories || 0;
        protein += item.protein || 0;
        carbs += item.carbs || 0;
        fat += item.fat || 0;
      });
    });
    return { calories, protein, carbs, fat };
  };

  const calculateWeeklyTotals = () => {
    let totalCalories = 0,
      totalProtein = 0,
      totalCarbs = 0,
      totalFat = 0;
    let daysWithFood = 0;

    days.forEach((day) => {
      const totals = calculateDayTotals(day);
      const hasFood =
        totals.calories > 0 ||
        totals.protein > 0 ||
        totals.carbs > 0 ||
        totals.fat > 0;
      if (hasFood) daysWithFood++;

      totalCalories += totals.calories;
      totalProtein += totals.protein;
      totalCarbs += totals.carbs;
      totalFat += totals.fat;
    });

    const divisor = daysWithFood > 0 ? daysWithFood : 7;

    return {
      avgCalories: Math.round(totalCalories / divisor),
      avgProtein: Math.round(totalProtein / divisor),
      avgCarbs: Math.round(totalCarbs / divisor),
      avgFat: Math.round(totalFat / divisor),
    };
  };

  const handleSaveAsTemplate = async () => {
    if (!planName) {
      toast.error(t("templateNameRequired"));
      return;
    }

    setSavingTemplate(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("notLoggedIn"));
      setSavingTemplate(false);
      return;
    }

    const { avgCalories, avgProtein, avgCarbs, avgFat } =
      calculateWeeklyTotals();

    let content = `# ${planName}\n\n`;
    days.forEach((day) => {
      content += `## ${day.dayName}\n\n`;
      mealTypes.forEach((meal) => {
        const meals = day[meal.id as Exclude<keyof DayMeals, "day" | "dayName">] as MealEntry[];
        if (meals.length > 0) {
          content += `### ${meal.label}\n`;
          meals.forEach((item) => {
            content += `- ${item.food_name}`;
            if (item.quantity) content += ` (${item.quantity} ${item.unit})`;
            if (item.calories) content += ` - ${item.calories} kcal`;
            if (item.protein) content += `, ${item.protein}g P`;
            if (item.carbs) content += `, ${item.carbs}g Sz`;
            if (item.fat) content += `, ${item.fat}g Zs`;
            content += `\n`;
            if (item.options)
              content += `  - ${t("optionsLabel")}: ${item.options}\n`;
            if (item.meal_notes)
              content += `  - ${t("notesLabel")}: ${item.meal_notes}\n`;
          });
          content += `\n`;
        }
      });
      content += `---\n\n`;
    });

    if (shoppingList) {
      content += `## 🛒 ${t("shoppingListTitle")}\n\n`;
      shoppingList
        .split("\n")
        .filter((item) => item.trim())
        .forEach((item) => {
          content += `- ${item.trim()}\n`;
        });
      content += `\n---\n\n`;
    }

    const { error } = await supabase.from("meal_plan_templates").insert([
      {
        coach_id: user.id,
        name: planName,
        description: `${t("templatePrefix")}: ${planName}`,
        content: content,
        daily_calories: dailyCalories || avgCalories,
        daily_protein: avgProtein,
        daily_carbs: avgCarbs,
        daily_fat: avgFat,
        notes: t("templateNotes"),
        is_public: false,
      },
    ]);

    if (error) {
      toast.error(t("templateSaveError") + error.message);
    } else {
      toast.success(t("templateSaveSuccess"));
    }
    setSavingTemplate(false);
  };

  const handleSubmit = async () => {
    if (!planName) {
      toast.error(t("planNameRequired"));
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("notLoggedIn"));
      setLoading(false);
      return;
    }

    const { avgCalories, avgProtein, avgCarbs, avgFat } =
      calculateWeeklyTotals();

    const { data: plan, error: planError } = await supabase
      .from("meal_plans")
      .insert({
        coach_id: user.id,
        client_id: clientId,
        name: planName,
        description: `${t("planDescription")} - ${planName}`,
        content: t("structuredContent"),
        daily_calories: dailyCalories || avgCalories,
        daily_protein: avgProtein,
        daily_carbs: avgCarbs,
        daily_fat: avgFat,
        status: "active",
        shopping_list: shoppingList || null,
      })
      .select()
      .single();

    if (planError) {
      toast.error(t("saveError") + planError.message);
      setLoading(false);
      return;
    }

    const allEntries: any[] = [];

    days.forEach((day) => {
      mealTypes.forEach((meal) => {
        const meals = day[meal.id as Exclude<keyof DayMeals, "day" | "dayName">] as MealEntry[];
        meals.forEach((item, idx) => {
          if (item.food_name) {
            let combinedNotes = item.notes || "";
            if (item.options) {
              combinedNotes += `${combinedNotes ? "\n" : ""}🔹 ${t("optionsLabel")}: ${item.options}`;
            }
            if (item.meal_notes) {
              combinedNotes += `${combinedNotes ? "\n" : ""}📝 ${t("notesLabel")}: ${item.meal_notes}`;
            }

            allEntries.push({
              meal_plan_id: plan.id,
              day_of_week: day.day,
              meal_type: meal.id,
              food_name: item.food_name,
              quantity: item.quantity,
              unit: item.unit || "g",
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
              notes: combinedNotes || null,
              order_index: idx,
            });
          }
        });
      });
    });

    if (allEntries.length > 0) {
      const { error: entriesError } = await supabase
        .from("daily_meal_entries")
        .insert(allEntries);

      if (entriesError) {
        toast.error(t("entriesSaveError") + entriesError.message);
        setLoading(false);
        return;
      }
    }

    toast.success(t("saveSuccess", { name: planName }));
    onSave();
    onClose();
    setLoading(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        {/* Teljes reszponzivitás, m-0 mobilra és w-full a széleken való túlnyúlás ellen */}
        <DialogContent className="w-full max-w-5xl h-full sm:h-[90vh] p-0 gap-0 border-none bg-slate-50 overflow-hidden sm:rounded-[2.5rem] shadow-2xl flex flex-col m-0 sm:m-4">
          {/* Felső fix navbar miatti padding (pt-16) mobilra, flex-wrap az akciógomboknak */}
          <div className="bg-white px-4 sm:pl-8 sm:pr-16 py-4 sm:py-6 pt-16 sm:pt-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 shrink-0">
                <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight truncate">
                  {t("editorTitle")}
                </DialogTitle>
                <p className="text-indigo-600 font-bold text-xs sm:text-sm uppercase tracking-wider truncate">
                  {clientName}
                </p>
              </div>
            </div>

            {/* Gombok reszponzív elrendezése mobilra (vízszintes scroll vagy kompakt flex) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none lg:flex-wrap">
              {copySourceDay !== null && (
                <Button
                  variant="outline"
                  onClick={clearCopySource}
                  className="rounded-xl font-bold text-slate-500 border-slate-200 text-xs px-3 h-9 shrink-0"
                >
                  {t("clearCopy")}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="rounded-xl font-bold text-green-600 border-green-200 hover:bg-green-50 text-xs px-3 h-9 shrink-0"
              >
                <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("excelImport")}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveAsTemplate}
                disabled={savingTemplate}
                className="rounded-xl font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs px-3 h-9 shrink-0"
              >
                {savingTemplate ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <Copy className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">{t("saveTemplate")}</span>
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="rounded-xl font-bold text-slate-500 hover:bg-slate-100 text-xs px-3 h-9 shrink-0"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 sm:px-6 h-9 sm:h-10 text-xs font-bold shadow-md shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("savePlan")
                )}
              </Button>
            </div>
          </div>

          {showCopyTooltip && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0">
                  <Copy className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-xs sm:text-sm text-slate-700 flex-1">
                  <p className="font-semibold mb-1">{t("copyTipTitle")}</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-600 text-[11px] sm:text-xs ml-1">
                    <li>{t("copyTipStep1")}</li>
                    <li>{t("copyTipStep2")}</li>
                    <li>{t("copyTipStep3")}</li>
                  </ol>
                </div>
                <button
                  onClick={() => setShowCopyTooltip(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Napválasztó fülek vízszintesen görgethetővé tétele no-scrollbar mellett */}
            <div className="bg-white px-4 sm:px-6 border-b border-slate-100 shrink-0 overflow-x-auto scrollbar-none">
              <TabsList className="bg-transparent h-14 sm:h-16 gap-1.5 sm:gap-2 flex justify-start items-center min-w-max">
                {weekDays.map((day) => (
                  <div key={day.id} className="relative group">
                    <TabsTrigger
                      value={day.id.toString()}
                      className={`rounded-xl px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-black transition-all ${
                        copySourceDay === day.id - 1
                          ? "bg-green-100 text-green-700 border-2 border-green-300"
                          : "data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {day.name}
                      {copySourceDay === day.id - 1 && (
                        <span className="ml-1.5 text-[9px] bg-green-500 text-white px-1 py-0.5 rounded-full">
                          {t("copied")}
                        </span>
                      )}
                    </TabsTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyDay(day.id - 1);
                      }}
                      className={`absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full shadow-md transition-all ${
                        copySourceDay === day.id - 1
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-white border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                      }`}
                      title={t("copyDay")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-10">
              <div className="max-w-3xl mx-auto bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5">
                <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                  <div className="w-1.5 h-5 sm:h-6 bg-indigo-600 rounded-full" />
                  {t("basicData")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-black text-slate-400 uppercase ml-1">
                      {t("planName")} *
                    </Label>
                    <Input
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50/50 text-sm font-bold focus:ring-indigo-500"
                      placeholder={t("planNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-black text-slate-400 uppercase ml-1">
                      {t("dailyCalories")}
                    </Label>
                    <Input
                      type="number"
                      value={dailyCalories || ""}
                      onChange={(e) =>
                        setDailyCalories(parseInt(e.target.value))
                      }
                      className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50/50 text-sm font-bold"
                      placeholder="2500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                  <Label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                    <ShoppingCart className="h-3.5 w-3.5 text-emerald-500" />
                    {t("shoppingList")}
                  </Label>
                  <Textarea
                    value={shoppingList}
                    onChange={(e) => setShoppingList(e.target.value)}
                    placeholder={t("shoppingListPlaceholder")}
                    rows={3}
                    className="rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50/50 text-sm font-medium resize-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    {t("shoppingListHint")}
                  </p>
                </div>
              </div>

              {days.map((day, dayIndex) => {
                const totals = calculateDayTotals(day);
                return (
                  <TabsContent
                    key={day.day}
                    value={day.day.toString()}
                    className="m-0 space-y-6 sm:space-y-10 pb-12 sm:pb-20"
                  >
                    {copySourceDay !== null && copySourceDay !== dayIndex && (
                      <div className="max-w-3xl mx-auto">
                        <Button
                          onClick={() => pasteDay(dayIndex)}
                          variant="default"
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-md"
                        >
                          <ClipboardCopy className="h-4 w-4 mr-2" />
                          {t("pasteFrom", {
                            dayName: days[copySourceDay].dayName,
                          })}
                        </Button>
                      </div>
                    )}

                    {/* Makrotápanyag rács mobilra 2 oszlopos elrendezéssel */}
                    <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      <MacroBox
                        label={t("calories")}
                        value={totals.calories}
                        unit="kcal"
                        icon={
                          <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                        }
                      />
                      <MacroBox
                        label={t("protein")}
                        value={totals.protein}
                        unit="g"
                        icon={
                          <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
                        }
                      />
                      <MacroBox
                        label={t("carbs")}
                        value={totals.carbs}
                        unit="g"
                        icon="🍚"
                      />
                      <MacroBox
                        label={t("fat")}
                        value={totals.fat}
                        unit="g"
                        icon="🥑"
                      />
                    </div>

                    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                      {mealTypes.map((meal) => {
                        const meals = day[
                          meal.id as Exclude<keyof DayMeals, "day" | "dayName">
                        ] as MealEntry[];
                        const isExpanded =
                          expandedMeals[`${dayIndex}-${meal.id}`] || false;

                        return (
                          <div
                            key={meal.id}
                            className={`border rounded-xl sm:rounded-2xl overflow-hidden transition-all ${
                              meals.length > 0
                                ? meal.borderColor
                                : "border-dashed border-slate-200"
                            }`}
                          >
                            <div
                              className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                                meals.length > 0
                                  ? meal.color.replace("text-", "bg-")
                                  : "bg-slate-50/50"
                              }`}
                              onClick={() =>
                                toggleMealExpand(dayIndex, meal.id)
                              }
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div
                                  className={`p-1.5 sm:p-2 rounded-xl ${meal.color} shadow-sm shrink-0`}
                                >
                                  <meal.icon className="h-4 w-4" />
                                </div>
                                <h4 className="font-black text-slate-700 uppercase tracking-widest text-xs sm:text-sm truncate">
                                  {meal.label}
                                  {meals.length > 0 && (
                                    <span className="ml-1 text-[11px] font-normal text-slate-400 lower-case">
                                      ({meals.length})
                                    </span>
                                  )}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addFoodItem(dayIndex, meal.id);
                                  }}
                                  className="rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-bold h-8 text-xs px-2"
                                >
                                  <Plus className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">
                                    {t("addFood")}
                                  </span>
                                </Button>
                                {meals.length > 0 && (
                                  <div className="text-slate-400 p-1">
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 bg-white">
                                {meals.length === 0 ? (
                                  <div className="text-center py-4 text-slate-300 text-xs sm:text-sm font-medium">
                                    {t("noFoodItems")}
                                  </div>
                                ) : (
                                  meals.map((item, itemIndex) => (
                                    <div
                                      key={itemIndex}
                                      className="bg-slate-50/50 p-3 sm:p-4 rounded-xl border border-slate-100 space-y-3"
                                    >
                                      {/* Ételnév és tápanyagok elrendezésének reszponzivitása */}
                                      <div className="flex flex-col gap-3">
                                        <div className="space-y-1">
                                          <Label className="text-[10px] font-black text-slate-400 uppercase">
                                            {t("foodName")}
                                          </Label>
                                          <Input
                                            value={item.food_name}
                                            onChange={(e) =>
                                              updateFoodItem(
                                                dayIndex,
                                                meal.id,
                                                itemIndex,
                                                "food_name",
                                                e.target.value,
                                              )
                                            }
                                            className="h-10 border-none bg-white rounded-xl font-bold text-sm text-slate-700 w-full shadow-sm"
                                            placeholder={t(
                                              "foodNamePlaceholder",
                                            )}
                                          />
                                        </div>

                                        {/* Tápanyagok kis kijelzőn 4, mobilon 4 sűrített oszlop */}
                                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                          <InputCol
                                            label={t("kcalShort")}
                                            value={item.calories}
                                            color="text-orange-600"
                                            onChange={(v: number | null) =>
                                              updateFoodItem(
                                                dayIndex,
                                                meal.id,
                                                itemIndex,
                                                "calories",
                                                v,
                                              )
                                            }
                                          />
                                          <InputCol
                                            label={t("proteinShort")}
                                            value={item.protein}
                                            color="text-indigo-600"
                                            onChange={(v: number | null) =>
                                              updateFoodItem(
                                                dayIndex,
                                                meal.id,
                                                itemIndex,
                                                "protein",
                                                v,
                                              )
                                            }
                                          />
                                          <InputCol
                                            label={t("carbsShort")}
                                            value={item.carbs}
                                            color="text-emerald-600"
                                            onChange={(v: number | null) =>
                                              updateFoodItem(
                                                dayIndex,
                                                meal.id,
                                                itemIndex,
                                                "carbs",
                                                v,
                                              )
                                            }
                                          />
                                          <InputCol
                                            label={t("fatShort")}
                                            value={item.fat}
                                            color="text-amber-600"
                                            onChange={(v: number | null) =>
                                              updateFoodItem(
                                                dayIndex,
                                                meal.id,
                                                itemIndex,
                                                "fat",
                                                v,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>

                                      {/* Opciók és Megjegyzések stackelése mobilon */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                        <div className="space-y-1">
                                          <Label className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1">
                                            <Pencil className="h-3 w-3" />
                                            {t("optionsLabel")}
                                          </Label>
                                          <Input
                                            value={item.options || ""}
                                            onChange={(e) =>
                                              updateFoodItem(
                                                dayIndex,
                                                meal.id,
                                                itemIndex,
                                                "options",
                                                e.target.value,
                                              )
                                            }
                                            className="h-9 text-xs border-slate-200 bg-white rounded-lg shadow-sm"
                                            placeholder={t(
                                              "optionsPlaceholder",
                                            )}
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1">
                                            <ClipboardList className="h-3 w-3" />
                                            {t("notesLabel")}
                                          </Label>
                                          <Input
                                            value={item.meal_notes || ""}
                                            onChange={(e) =>
                                              updateFoodItem(
                                                dayIndex,
                                                meal.id,
                                                itemIndex,
                                                "meal_notes",
                                                e.target.value,
                                              )
                                            }
                                            className="h-9 text-xs border-slate-200 bg-white rounded-lg shadow-sm"
                                            placeholder={t("notesPlaceholder")}
                                          />
                                        </div>
                                      </div>

                                      <div className="flex justify-end pt-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removeFoodItem(
                                              dayIndex,
                                              meal.id,
                                              itemIndex,
                                            )
                                          }
                                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg h-8 px-2.5 text-xs font-semibold"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                                          {t("delete")}
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}

                            {!isExpanded && meals.length > 0 && (
                              <div className="px-3 sm:px-4 py-2 bg-white border-t border-slate-50">
                                <div className="flex flex-wrap gap-1.5">
                                  {meals.map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[11px] font-medium text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-full truncate max-w-[150px]"
                                    >
                                      {item.food_name || t("unnamedFood")}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                );
              })}
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </>
  );
}

function MacroBox({ label, value, unit, icon }: any) {
  const formatValue = (val: number) => {
    if (val === undefined || val === null) return "0";
    return val.toFixed(1); // Kompaktabb tizedesjegy kijelzés mobilra
  };

  return (
    <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-0.5 group hover:border-indigo-100 transition-colors">
      <div className="mb-0.5 text-sm sm:text-base">{icon}</div>
      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter text-center">
        {label}
      </p>
      <p className="text-base sm:text-xl font-black text-slate-800">
        {formatValue(value)}{" "}
        <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">
          {unit}
        </span>
      </p>
    </div>
  );
}

function InputCol({ label, value, color, onChange }: { label: string; value: number | null; color: string; onChange: (value: number | null) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    if (rawValue === "") {
      onChange(null);
      return;
    }

    let num = parseFloat(rawValue);
    if (!isNaN(num)) {
      num = Math.round(num * 100) / 100;
      onChange(num);
    }
  };

  const displayValue = () => {
    if (value === null || value === undefined) return "";
    return value.toString(); // Egyszerűbb beviteli élmény mobilon formázás nélkül
  };

  return (
    <div className="space-y-1 text-center min-w-0">
      <Label
        className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tighter block truncate ${color}`}
      >
        {label}
      </Label>
      <Input
        type="number"
        step="0.01"
        value={displayValue()}
        onChange={handleChange}
        className="h-9 border-none bg-white rounded-xl text-center font-black p-1 focus:ring-2 focus:ring-indigo-100 transition-all text-xs shadow-sm w-full"
      />
    </div>
  );
}
