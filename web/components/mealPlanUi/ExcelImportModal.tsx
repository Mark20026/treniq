"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Download,
  FileUp,
  Info,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import * as XLSX from "xlsx";

interface MealEntry {
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

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: DayMeals[], shoppingList?: string) => void;
}

const dayMapping: Record<string, number> = {
  hétfő: 1,
  hetfo: 1,
  monday: 1,
  kedd: 2,
  tuesday: 2,
  szerda: 3,
  wednesday: 3,
  csütörtök: 4,
  csutortok: 4,
  thursday: 4,
  péntek: 5,
  pentek: 5,
  friday: 5,
  szombat: 6,
  saturday: 6,
  vasárnap: 7,
  vasarnap: 7,
  sunday: 7,
};

const mealMapping: Record<string, string> = {
  reggeli: "breakfast",
  tízórai: "morning_snack",
  tizorai: "morning_snack",
  ebéd: "lunch",
  ebed: "lunch",
  uzsonna: "afternoon_snack",
  vacsora: "dinner",
  "esti snack": "evening_snack",
  estisnack: "evening_snack",
};

const columnMappings = {
  day: ["Nap", "nap", "DAY", "Day", "Nap neve", "nap_neve"],
  meal: ["Étkezés", "etkezes", "MEAL", "Meal", "Etkezes"],
  food: ["Étel neve", "etel_neve", "FOOD", "Food", "Etel neve", "étel"],
  quantity: [
    "Mennyiség",
    "mennyiseg",
    "QUANTITY",
    "Quantity",
    "mennyiseg",
    "Adag",
  ],
  unit: [
    "Mértékegység",
    "mertekegyseg",
    "UNIT",
    "Unit",
    "mertekegyseg",
    "Egység",
  ],
  calories: ["Kalória", "kaloria", "CALORIES", "Calories", "kcal", "Kcal"],
  protein: ["Fehérje", "feherje", "PROTEIN", "Protein", "feherje", "P"],
  carbs: [
    "Szénhidrát",
    "szenhidrat",
    "CARBS",
    "Carbs",
    "szenhidrat",
    "CH",
    "Sz",
  ],
  fat: ["Zsír", "zsir", "FAT", "Fat", "zsir", "Zs"],
  options: [
    "Opciók",
    "opciok",
    "OPTIONS",
    "Options",
    "Helyettesítés",
    "helyettesites",
  ],
  meal_notes: ["Megjegyzés", "megjegyzes", "NOTES", "Notes", "Extra", "extra"],
};

function findColumn(headers: string[], targetColumns: string[]): string | null {
  for (const header of headers) {
    const normalizedHeader = header?.toString().toLowerCase().trim();
    if (targetColumns.some((col) => col.toLowerCase() === normalizedHeader)) {
      return header;
    }
  }
  return null;
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImport,
}: ExcelImportModalProps) {
  const t = useTranslations("ExcelImport");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [detectedColumns, setDetectedColumns] = useState<
    Record<string, string>
  >({});
  const [extractedShoppingList, setExtractedShoppingList] =
    useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (
      droppedFile &&
      (droppedFile.name.endsWith(".xlsx") ||
        droppedFile.name.endsWith(".xls") ||
        droppedFile.name.endsWith(".csv"))
    ) {
      handleFileSelection(droppedFile);
    } else {
      toast.error(t("invalidFileType"));
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setFile(selectedFile);
    setErrors([]);
    setWarnings([]);
    setExtractedShoppingList("");
    parseExcelPreview(selectedFile);
  };

  const parseExcelPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        const detected: Record<string, string> = {};

        for (const [key, possibleNames] of Object.entries(columnMappings)) {
          const found = findColumn(headers, possibleNames);
          if (found) detected[key] = found;
        }

        setDetectedColumns(detected);

        const shoppingListItems: string[] = [];
        rows.forEach((row: any) => {
          for (const [key, value] of Object.entries(row)) {
            const strValue = value?.toString().trim() || "";
            const colName = key.toLowerCase();
            if (
              (colName.includes("bevásárló") ||
                colName.includes("shopping") ||
                colName.includes("bevasarlo")) &&
              strValue
            ) {
              shoppingListItems.push(strValue);
            }
          }
        });

        if (shoppingListItems.length > 0) {
          const uniqueItems = [...new Set(shoppingListItems)];
          setExtractedShoppingList(uniqueItems.join("\n"));
        }

        const missingColumns = [];
        if (!detected.day) missingColumns.push(t("columnDay"));
        if (!detected.meal) missingColumns.push(t("columnMeal"));
        if (!detected.food) missingColumns.push(t("columnFood"));

        if (missingColumns.length > 0) {
          setWarnings([
            t("missingColumns", { columns: missingColumns.join(", ") }),
          ]);
        }
      }

      setPreview(rows.slice(0, 5));
    };
    reader.readAsArrayBuffer(file);
  };

  const clearFile = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setWarnings([]);
    setDetectedColumns({});
    setExtractedShoppingList("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const template = [
      [
        t("templateDay"),
        t("templateMeal"),
        t("templateFood"),
        t("templateQuantity"),
        t("templateUnit"),
        t("templateCalories"),
        t("templateProtein"),
        t("templateCarbs"),
        t("templateFat"),
        t("templateOptions"),
        t("templateNotes"),
        t("templateShoppingList"),
      ],
      [
        t("templateMonday"),
        t("templateBreakfast"),
        "Oatmeal",
        "50",
        "g",
        "190",
        "6",
        "32",
        "3",
        t("templateBreakfastOption"),
        t("templateBreakfastNote"),
        "oatmeal",
      ],
      [
        t("templateMonday"),
        t("templateBreakfast"),
        "Milk",
        "200",
        "ml",
        "90",
        "6",
        "9",
        "5",
        t("templateMilkOption"),
        "",
        "milk",
      ],
      [
        t("templateMonday"),
        t("templateMorningSnack"),
        "Apple",
        "1",
        "pc",
        "80",
        "0.5",
        "20",
        "0.2",
        t("templateAppleOption"),
        "",
        "apple",
      ],
      [
        t("templateMonday"),
        t("templateLunch"),
        "Chicken breast",
        "150",
        "g",
        "247",
        "46",
        "0",
        "5.4",
        t("templateChickenOption"),
        t("templateChickenNote"),
        "chicken breast",
      ],
      ["", "", "", "", "", "", "", "", "", "", "", "rice"],
      ["", "", "", "", "", "", "", "", "", "", "", "broccoli"],
      ["", "", "", "", "", "", "", "", "", "", "", "eggs 6pcs"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("templateSheetName"));
    XLSX.writeFile(wb, "meal_plan_template.xlsx");
    toast.success(t("templateDownloaded"));
  };

  const processImport = () => {
    if (!file) return;

    setLoading(true);
    setErrors([]);
    setWarnings([]);

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      const days: DayMeals[] = [
        {
          day: 1,
          dayName: "Hétfő",
          breakfast: [],
          morning_snack: [],
          lunch: [],
          afternoon_snack: [],
          dinner: [],
          evening_snack: [],
        },
        {
          day: 2,
          dayName: "Kedd",
          breakfast: [],
          morning_snack: [],
          lunch: [],
          afternoon_snack: [],
          dinner: [],
          evening_snack: [],
        },
        {
          day: 3,
          dayName: "Szerda",
          breakfast: [],
          morning_snack: [],
          lunch: [],
          afternoon_snack: [],
          dinner: [],
          evening_snack: [],
        },
        {
          day: 4,
          dayName: "Csütörtök",
          breakfast: [],
          morning_snack: [],
          lunch: [],
          afternoon_snack: [],
          dinner: [],
          evening_snack: [],
        },
        {
          day: 5,
          dayName: "Péntek",
          breakfast: [],
          morning_snack: [],
          lunch: [],
          afternoon_snack: [],
          dinner: [],
          evening_snack: [],
        },
        {
          day: 6,
          dayName: "Szombat",
          breakfast: [],
          morning_snack: [],
          lunch: [],
          afternoon_snack: [],
          dinner: [],
          evening_snack: [],
        },
        {
          day: 7,
          dayName: "Vasárnap",
          breakfast: [],
          morning_snack: [],
          lunch: [],
          afternoon_snack: [],
          dinner: [],
          evening_snack: [],
        },
      ];

      const importErrors: string[] = [];
      const importWarnings: string[] = [];
      let importedCount = 0;
      let skippedCount = 0;
      const shoppingListItems: string[] = [];

      const dayCol = detectedColumns.day || "Nap";
      const mealCol = detectedColumns.meal || "Étkezés";
      const foodCol = detectedColumns.food || "Étel neve";
      const quantityCol = detectedColumns.quantity || "Mennyiség";
      const unitCol = detectedColumns.unit || "Mértékegység";
      const caloriesCol = detectedColumns.calories || "Kalória";
      const proteinCol = detectedColumns.protein || "Fehérje";
      const carbsCol = detectedColumns.carbs || "Szénhidrát";
      const fatCol = detectedColumns.fat || "Zsír";
      const optionsCol = detectedColumns.options || "Opciók";
      const mealNotesCol = detectedColumns.meal_notes || "Megjegyzés";

      rows.forEach((row, idx) => {
        const rowNum = idx + 2;

        const dayStr = row[dayCol] || row.Nap || "";
        const mealStr = row[mealCol] || row.Étkezés || "";
        const foodName = row[foodCol] || row["Étel neve"] || "";

        for (const [key, value] of Object.entries(row)) {
          const strValue = value?.toString().trim() || "";
          const colName = key.toLowerCase();
          if (
            (colName.includes("bevásárló") ||
              colName.includes("shopping") ||
              colName.includes("bevasarlo") ||
              colName === "bevásárló lista") &&
            strValue
          ) {
            shoppingListItems.push(strValue);
          }
        }

        if (!foodName || foodName.toString().trim() === "") {
          skippedCount++;
          return;
        }

        const quantity = parseFloat(
          row[quantityCol]?.toString().replace(",", ".") || "0",
        );
        const unit = row[unitCol] || "g";
        const calories = parseInt(
          row[caloriesCol]?.toString().replace(",", ".") || "0",
        );
        const protein = parseFloat(
          row[proteinCol]?.toString().replace(",", ".") || "0",
        );
        const carbs = parseFloat(
          row[carbsCol]?.toString().replace(",", ".") || "0",
        );
        const fat = parseFloat(
          row[fatCol]?.toString().replace(",", ".") || "0",
        );
        const options = row[optionsCol]?.toString() || "";
        const mealNotes = row[mealNotesCol]?.toString() || "";

        const normalizedDay = dayStr
          ?.toString()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const normalizedMeal = mealStr
          ?.toString()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        const dayNum = dayMapping[normalizedDay];
        const mealType = mealMapping[normalizedMeal];

        if (!dayNum) {
          importErrors.push(
            `${rowNum}. ${t("errorUnknownDay")} (${dayStr}) - ${t("errorUseDays")}`,
          );
          return;
        }
        if (!mealType) {
          importErrors.push(
            `${rowNum}. ${t("errorUnknownMeal")} (${mealStr}) - ${t("errorUseMeals")}`,
          );
          return;
        }

        const dayIndex = dayNum - 1;

        const roundToTwo = (num: number) =>
          isNaN(num) ? null : Math.round(num * 100) / 100;

        days[dayIndex][mealType as Exclude<keyof DayMeals, "day" | "dayName">].push({
          food_name: foodName.toString().trim(),
          quantity: quantity > 0 ? roundToTwo(quantity) : null,
          unit: unit || "g",
          calories: !isNaN(calories) && calories > 0 ? calories : null,
          protein: protein > 0 ? roundToTwo(protein) : null,
          carbs: carbs > 0 ? roundToTwo(carbs) : null,
          fat: fat > 0 ? roundToTwo(fat) : null,
          notes: "",
          options: options || "",
          meal_notes: mealNotes || "",
        });
        importedCount++;
      });

      const uniqueShoppingItems = [
        ...new Set(
          shoppingListItems
            .filter((item) => item && item.trim() !== "")
            .map((item) => item.trim()),
        ),
      ];
      const shoppingListText = uniqueShoppingItems.join("\n");

      if (skippedCount > 0) {
        importWarnings.push(t("skippedRows", { count: skippedCount }));
      }

      const missingRecommended = [];
      if (!detectedColumns.calories)
        missingRecommended.push(t("recommendedCalories"));
      if (!detectedColumns.protein)
        missingRecommended.push(t("recommendedProtein"));
      if (!detectedColumns.carbs)
        missingRecommended.push(t("recommendedCarbs"));
      if (!detectedColumns.fat) missingRecommended.push(t("recommendedFat"));

      if (missingRecommended.length > 0 && missingRecommended.length < 4) {
        importWarnings.push(
          t("missingRecommended", { columns: missingRecommended.join(", ") }),
        );
      }

      if (importErrors.length > 0) {
        setErrors(importErrors);
        toast.error(t("errorsCount", { count: importErrors.length }));
        setLoading(false);
        return;
      }

      if (importWarnings.length > 0) {
        setWarnings(importWarnings);
      }

      if (importedCount === 0 && !shoppingListText) {
        toast.error(t("importFailed"));
        setLoading(false);
        return;
      }

      onImport(days, shoppingListText);
      toast.success(
        `${importedCount} ${t("importedFoods")}${shoppingListText ? ` ${shoppingListText.split("\n").length} ${t("shoppingItems")}` : ""}`,
      );
      clearFile();
      onClose();
      setLoading(false);
    };

    reader.onerror = () => {
      toast.error(t("fileReadError"));
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[92vh] sm:h-auto max-h-[92vh] flex flex-col p-0 gap-0 border-none bg-slate-50 overflow-hidden rounded-2xl sm:rounded-[2rem] shadow-2xl antialiased">
        {/* A pt-20 kezeli a fix mobil navbar magasságát, sm mérettől visszaáll normálra */}
        <div className="bg-white px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0 pt-20 sm:pt-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="p-2 sm:p-3 bg-emerald-50 rounded-xl sm:rounded-2xl shrink-0">
              <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-xl font-black text-slate-800 truncate">
                {t("title")}
              </DialogTitle>
              <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 touch-pan-y">
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1 text-sm sm:text-base">
                <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                {t("howItWorks")}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {t("howItWorksDescription")}
                <br />
                <span className="text-[11px] sm:text-xs text-indigo-500 font-medium block mt-1">
                  ✨ {t("shoppingListHint")}
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full md:w-auto rounded-xl sm:rounded-2xl border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold h-10 sm:h-12 px-4 sm:px-6 shrink-0 transition-all active:scale-95 text-xs sm:text-sm"
            >
              <Download className="h-4 w-4 mr-2 shrink-0" />
              {t("downloadTemplate")}
            </Button>
          </div>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl sm:rounded-[2rem] p-6 sm:p-12 text-center transition-all duration-300 cursor-pointer
                ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50/50 scale-[0.99] shadow-inner"
                    : "border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xl"
                }
              `}
            >
              <div className="bg-indigo-50 w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm">
                <FileUp
                  className={`h-7 w-7 sm:h-10 sm:w-10 transition-transform duration-500 ${isDragging ? "animate-bounce" : "text-indigo-600"}`}
                />
              </div>
              <h3 className="text-sm sm:text-lg font-black text-slate-700 mb-1">
                {t("dragDrop")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {t("orClickToBrowse")}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-300 mt-2">
                {t("supportedFormats")}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileSelection(e.target.files[0])
                }
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {Object.keys(detectedColumns).length > 0 && (
                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100">
                  <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase mb-2">
                    ✅ {t("detectedColumns")}:
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {Object.entries(detectedColumns).map(([key, col]) => (
                      <span
                        key={key}
                        className="text-[10px] sm:text-xs bg-white px-2 py-0.5 sm:py-1 rounded-lg text-slate-600 border border-slate-100"
                      >
                        {col} → {key}
                      </span>
                    ))}
                    {detectedColumns.options && (
                      <span className="text-[10px] sm:text-xs bg-amber-50 px-2 py-0.5 sm:py-1 rounded-lg text-amber-600 border border-amber-200">
                        ✨ {detectedColumns.options} → {t("options")}
                      </span>
                    )}
                    {detectedColumns.meal_notes && (
                      <span className="text-[10px] sm:text-xs bg-blue-50 px-2 py-0.5 sm:py-1 rounded-lg text-blue-600 border border-blue-200">
                        ✨ {detectedColumns.meal_notes} → {t("notes")}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {extractedShoppingList && (
                <div className="bg-emerald-50 p-3 sm:p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase">
                      🛒 {t("globalShoppingList")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {extractedShoppingList.split("\n").map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] sm:text-xs bg-white px-2 py-0.5 sm:py-1 rounded-lg text-slate-600 border border-emerald-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-emerald-600 mt-2 font-medium">
                    {extractedShoppingList.split("\n").length}{" "}
                    {t("itemsInList")}
                  </p>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="bg-amber-50 p-3 sm:p-4 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase">
                      {t("warnings")}
                    </p>
                  </div>
                  <ul className="list-disc list-inside text-[11px] sm:text-xs text-amber-700 space-y-1">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-[1.5rem] border-2 border-emerald-100 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="p-2 sm:p-3 bg-emerald-500 rounded-xl shrink-0">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm sm:text-base truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB • {t("readyToImport")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 shrink-0"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>

              {preview.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">
                      {t("dataPreview")}
                    </p>
                  </div>
                  <div className="overflow-x-auto block w-full touch-pan-x">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-white">
                          {preview.length > 0 &&
                            Object.keys(preview[0]).map((key) => (
                              <th
                                key={key}
                                className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-700 border-b border-slate-100 text-[11px] sm:text-xs whitespace-nowrap"
                              >
                                {key}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            {Object.values(row).map((val: any, i) => (
                              <td
                                key={i}
                                className="px-4 sm:px-6 py-3 sm:py-4 text-slate-500 border-b border-slate-50 truncate max-w-[150px] text-[11px] sm:text-xs"
                              >
                                {val !== undefined && val !== null
                                  ? String(val).slice(0, 40)
                                  : "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-rose-50 p-4 sm:p-6 rounded-xl sm:rounded-[1.5rem] border border-rose-100">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 bg-rose-500 rounded-lg shrink-0">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <p className="font-bold text-rose-700 text-xs sm:text-sm">
                  {t("errorsOccurred", { count: errors.length })}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {errors.slice(0, 10).map((err, i) => (
                  <div
                    key={i}
                    className="text-[11px] sm:text-xs text-rose-600 bg-white/50 p-2 rounded-lg border border-rose-100/50 flex items-start gap-2"
                  >
                    <span className="font-bold opacity-50 shrink-0">
                      #{i + 1}
                    </span>{" "}
                    <span className="break-words">{err}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white px-4 sm:px-8 py-4 sm:py-6 border-t border-slate-100 flex flex-row justify-between items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl font-bold text-slate-400 hover:text-slate-600 text-xs sm:text-sm px-3 sm:px-4"
          >
            {t("cancel")}
          </Button>
          <div className="flex gap-2">
            {file && (
              <Button
                variant="outline"
                onClick={clearFile}
                className="rounded-xl border-slate-200 font-bold text-slate-600 text-xs sm:text-sm px-3 sm:px-4 hidden sm:inline-flex"
              >
                {t("newFile")}
              </Button>
            )}
            <Button
              onClick={processImport}
              disabled={!file || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 sm:px-8 font-black shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 text-xs sm:text-sm h-10 sm:h-11"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t("startImport")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
