"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Navbar";
import AddMeasurementModal from "@/components/AddMeasurementModal";
import MeasurementHistory from "@/components/MeasurementHistory";
import AddWorkoutPlanModal from "@/components/AddWorkoutPlanModal";
import WorkoutPlansList from "@/components/WorkoutPlansList";
import WorkoutLogsList from "@/components/exerciseUi/WorkoutLogsList";
import ClientCharts from "@/components/clientsUi/ClientChart";
import FileUpload from "@/components/FileUpload";
import FileList from "@/components/FileList";
import AddMealPlanModal from "@/components/mealPlanUi/AddMealPlanModal";
import MealPlansList from "@/components/mealPlanUi/MealPlanList";
import {
  ArrowLeft,
  Plus,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Stethoscope,
  ShieldAlert,
  Target,
  UserCircle2,
  HeartPulse,
  Dumbbell,
  Activity,
  FolderOpen,
  FileText,
  Utensils,
  Camera,
  Video,
  File,
  Copy,
  Key,
  Check,
  TrendingUp as TrendingUpIcon,
  Brain,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const CustomDetailCard = ({
  title,
  icon: Icon,
  children,
  className = "",
}: any) => (
  <div
    className={`bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden ${className}`}
  >
    <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-indigo-500" />}
      <h3 className="font-black text-slate-800 text-[10px] md:text-[11px] tracking-widest uppercase">
        {title}
      </h3>
    </div>
    <div className="p-4 md:p-6">{children}</div>
  </div>
);

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  medical_conditions: string | null;
  allergies: string | null;
  injuries: string | null;
  goals: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
}

export default function ClientDetailPage() {
  const t = useTranslations("ClientDetail");
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isWorkoutPlanModalOpen, setIsWorkoutPlanModalOpen] = useState(false);
  const [isMealPlanModalOpen, setIsMealPlanModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mealRefreshKey, setMealRefreshKey] = useState(0);
  const [activeFileTab, setActiveFileTab] = useState<string>("workout_plan");
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [locale, setLocale] = useState("hu");

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const currentLocale = pathname?.split("/")[1] || "hu";
    setLocale(currentLocale);
  }, [pathname]);

  const fetchClient = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!error) setClient(data);
    setLoading(false);
  }, [params.id, router, locale]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleDataRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    fetchClient();
  };

  const handleMealRefresh = () => {
    setMealRefreshKey((prev) => prev + 1);
  };

  const handleFileUpload = () => {
    setFileRefreshKey((prev) => prev + 1);
  };

  const handleShowPassword = async () => {
    if (!client?.email) {
      toast.error(t("noEmail"));
      return;
    }

    setIsGeneratingPassword(true);

    try {
      const response = await fetch("/api/client-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}` },
        body: JSON.stringify({ clientId: client.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("unknownError"));
      }

      if (result.success && result.password) {
        setGeneratedPassword(result.password);
        setIsPasswordDialogOpen(true);
        toast.success(t("passwordGenerated"));
      } else {
        throw new Error(t("passwordGenerationFailed"));
      }
    } catch (error: any) {
      console.error("Password generation error:", error);
      toast.error(t("passwordGenerationError") + error.message);
    } finally {
      setIsGeneratingPassword(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success(t("passwordCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fileTabs = [
    {
      id: "workout_plan",
      label: t("workoutPlan"),
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "nutrition",
      label: t("mealPlan"),
      icon: <Utensils className="h-4 w-4" />,
    },
    {
      id: "progress_photo",
      label: t("progressPhotos"),
      icon: <Camera className="h-4 w-4" />,
    },
    {
      id: "video_tutorial",
      label: t("videos"),
      icon: <Video className="h-4 w-4" />,
    },
    { id: "other", label: t("other"), icon: <File className="h-4 w-4" /> },
  ];

  if (loading)
    return (
      <div className="flex min-h-screen flex-col lg:flex-row bg-[#f8fafc]">
        <Sidebar />
        {/* Itt is eltávolítottuk az md:ml-64-et */}
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600 border-r-2 border-transparent"></div>
        </div>
      </div>
    );

  if (!client) return null;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#f8fafc]">
      <Sidebar />

      {/*
        Eltávolítottuk az "md:ml-64" és "w-full" osztályokat.
        Ezentúl a Sidebar komponensben lévő Spacer tolja el a tartalmat dinamikusan!
      */}
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-10">
          <div className="space-y-4">
            <Link
              href={`/${locale}/clients`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors group font-bold text-xs uppercase tracking-widest"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              {t("backToList")}
            </Link>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 w-full lg:w-auto">
                <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-[1.2rem] sm:rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl shrink-0">
                  <UserCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
                      {client.full_name}
                    </h1>
                    <span
                      className={`px-2 py-0.5 md:px-3 md:py-1 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black tracking-widest uppercase border ${
                        client.status === "active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {client.status === "active" ? t("active") : t("inactive")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                    {client.email && (
                      <span className="flex items-center gap-1.5 text-xs md:text-sm text-slate-400 font-medium">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {client.email}
                      </span>
                    )}
                    {client.phone && (
                      <span className="flex items-center gap-1.5 text-xs md:text-sm text-slate-400 font-medium">
                        <Phone className="h-3.5 w-3.5 shrink-0" />{" "}
                        {client.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Akció gombok gridje mobilon, sorba rendezve nagyobb eszközökön */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-3 w-full lg:w-auto">
                <Link
                  href={`/${locale}/clients/${client.id}/progress`}
                  className="col-span-1 sm:flex-none"
                >
                  <button className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 md:gap-2 active:scale-95">
                    <TrendingUpIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                    {t("progress")}
                  </button>
                </Link>
                {client.email && (
                  <button
                    onClick={handleShowPassword}
                    disabled={isGeneratingPassword}
                    className="col-span-1 sm:flex-none bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 md:gap-2 active:scale-95"
                  >
                    <Key className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {isGeneratingPassword ? t("generating") : t("password")}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setIsWorkoutPlanModalOpen(true)}
                  className="col-span-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 md:gap-2 active:scale-95"
                >
                  <Dumbbell className="h-4 w-4 text-indigo-500 shrink-0" />
                  {t("workoutPlan")}
                </button>
                <button
                  onClick={() => setIsMeasurementModalOpen(true)}
                  className="col-span-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-1.5 md:gap-2 active:scale-95"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                  <span className="truncate">{t("newMeasurement")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Progress szekció */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 md:gap-3 px-2">
              <div className="p-1.5 md:p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                <TrendingUpIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                {t("progressAnalytics")}
              </h2>
            </div>
            <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] shadow-sm border border-slate-100 p-4 md:p-6 lg:p-10 transition-all hover:shadow-xl hover:shadow-slate-200/50 overflow-hidden">
              <ClientCharts clientId={client.id} />
            </div>
          </section>

          {/* Fő tartalom elrendezése */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            {/* Bal oldali széles oszlop */}
            <div className="lg:col-span-2 space-y-6 md:space-y-10">
              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 p-4 md:p-8 overflow-hidden">
                <WorkoutPlansList
                  key={refreshKey}
                  clientId={client.id}
                  onAddClick={() => setIsWorkoutPlanModalOpen(true)}
                  onRefresh={handleDataRefresh}
                />
              </div>

              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden p-4 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <Activity className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">
                    {t("workoutLog")}
                  </h3>
                </div>
                <WorkoutLogsList clientId={client.id} />
              </div>

              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 md:p-8 pb-0">
                  <h3 className="text-xs md:text-sm font-black text-slate-800 tracking-widest uppercase mb-4">
                    {t("measurementLog")}
                  </h3>
                </div>
                <MeasurementHistory
                  key={refreshKey}
                  clientId={client.id}
                  onRefresh={handleDataRefresh}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <CustomDetailCard title={t("professionalGoal")} icon={Target}>
                  <p className="text-sm text-slate-600 italic leading-relaxed font-medium">
                    {client.goals ? `"${client.goals}"` : t("noGoalSet")}
                  </p>
                </CustomDetailCard>

                <CustomDetailCard title={t("healthStatus")} icon={Stethoscope}>
                  <div className="space-y-4">
                    <div className="flex gap-3 p-3 rounded-2xl bg-slate-50 transition-colors hover:bg-slate-100/50">
                      <HeartPulse className="h-5 w-5 text-rose-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {t("medicalConditions")}
                        </p>
                        <p className="text-xs md:text-sm text-slate-700 font-bold truncate">
                          {client.medical_conditions || t("noData")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-2xl bg-slate-50 transition-colors hover:bg-slate-100/50">
                      <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {t("injuriesAllergies")}
                        </p>
                        <p className="text-xs md:text-sm text-slate-700 font-bold truncate">
                          {client.injuries || client.allergies
                            ? `${client.injuries || ""} ${client.allergies ? `(${client.allergies})` : ""}`
                            : t("noData")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CustomDetailCard>
              </div>
            </div>

            {/* Jobb oldali sáv */}
            <div className="space-y-6 md:space-y-8">
              <CustomDetailCard title={t("personalProfile")} icon={UserCircle2}>
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl gap-2">
                    <div className="flex items-center gap-2 shrink-0">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-500">
                        {t("born")}
                      </span>
                    </div>
                    <span className="text-xs md:text-sm font-black text-slate-800 text-right">
                      {client.birth_date
                        ? new Date(client.birth_date).toLocaleDateString(
                            `${locale}-HU`,
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="space-y-1.5 px-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{" "}
                      {t("address")}
                    </div>
                    <p className="text-xs md:text-sm font-bold text-slate-800 leading-snug break-words">
                      {client.address || t("notSpecified")}
                    </p>
                  </div>
                </div>
              </CustomDetailCard>

              <CustomDetailCard
                title={t("emergencyContact")}
                icon={ShieldAlert}
              >
                <div className="p-4 md:p-5 bg-rose-50/50 rounded-2xl md:rounded-3xl border border-rose-100">
                  <p className="text-[9px] md:text-[10px] font-black text-rose-400 uppercase mb-2 tracking-widest">
                    {t("contactPerson")}
                  </p>
                  <p className="text-sm md:text-base font-black text-rose-900 mb-3 truncate">
                    {client.emergency_contact || t("notSpecified")}
                  </p>
                  <a
                    href={`tel:${client.emergency_phone}`}
                    className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-rose-600 font-black text-xs shadow-sm hover:shadow-md transition-all active:scale-95"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {client.emergency_phone || t("call")}
                  </a>
                </div>
              </CustomDetailCard>

              {/* Fájlok rész - Görgethető fülek mobilon */}
              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 md:p-6 pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">
                      {t("files")}
                    </h3>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 mb-4">
                    {t("filesDescription")}
                  </p>
                </div>

                <div className="px-4 md:px-6 border-b border-slate-100">
                  {/* Görgethető tároló a füleknek mobilon */}
                  <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
                    {fileTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveFileTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all border-b-2 whitespace-nowrap shrink-0 ${
                          activeFileTab === tab.id
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <FileUpload
                    key={activeFileTab}
                    clientId={client.id}
                    clientName={client.full_name}
                    category={activeFileTab as any}
                    onUploadComplete={handleFileUpload}
                  />
                  <div className="mt-4 md:mt-6">
                    <FileList
                      key={fileRefreshKey}
                      clientId={client.id}
                      category={activeFileTab}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden p-4 md:p-6">
                <MealPlansList
                  key={mealRefreshKey}
                  clientId={client.id}
                  onAddClick={() => setIsMealPlanModalOpen(true)}
                  onRefresh={handleMealRefresh}
                />
              </div>

              {client.notes && (
                <CustomDetailCard title={t("coachNotes")}>
                  <div className="bg-amber-50/50 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-amber-100">
                    <p className="text-xs md:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                      {client.notes}
                    </p>
                  </div>
                </CustomDetailCard>
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="w-[92%] sm:max-w-md p-5 rounded-2xl md:rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-600 shrink-0" />
              {t("clientCredentials")}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {t("clientCredentialsDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="bg-amber-50 p-3 md:p-4 rounded-xl border border-amber-200">
              <p className="text-xs md:text-sm text-amber-700 mb-1.5 font-medium">
                {t("emailLabel")}:
              </p>
              <p className="text-sm font-mono bg-white p-2 rounded-lg border border-amber-100 break-all">
                {client?.email}
              </p>
            </div>

            <div className="bg-indigo-50 p-3 md:p-4 rounded-xl border border-indigo-200">
              <p className="text-xs md:text-sm text-indigo-700 mb-1.5 font-medium">
                {t("tempPassword")}:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-white p-2 rounded-lg border border-indigo-100 break-all">
                  {generatedPassword}
                </code>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-9 w-9 p-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-[11px] md:text-xs text-blue-600 leading-normal">
                {t("passwordWarning")}
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-start pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPasswordDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddMeasurementModal
        isOpen={isMeasurementModalOpen}
        onClose={() => setIsMeasurementModalOpen(false)}
        clientId={client.id}
        clientName={client.full_name}
        onMeasurementAdded={handleDataRefresh}
      />

      <AddWorkoutPlanModal
        isOpen={isWorkoutPlanModalOpen}
        onClose={() => setIsWorkoutPlanModalOpen(false)}
        clientId={client.id}
        clientName={client.full_name}
        onPlanAdded={handleDataRefresh}
      />

      <AddMealPlanModal
        isOpen={isMealPlanModalOpen}
        onClose={() => setIsMealPlanModalOpen(false)}
        clientId={client.id}
        clientName={client.full_name}
        onPlanAdded={() => {
          handleMealRefresh();
          fetchClient();
        }}
      />
    </div>
  );
}
