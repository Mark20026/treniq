"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Sidebar from "./Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ChevronRight,
  User,
  Bell,
  Dumbbell,
  MessageCircle,
  Stethoscope,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, subDays, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { hu } from "date-fns/locale";

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

interface WorkoutTrend {
  date: string;
  count: number;
}

export default function DashboardClient() {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState({
    totalClients: 0,
    activePlans: 0,
    todayWorkouts: 0,
    todayConsultations: 0,
    todayMeasurements: 0,
    weeklyWorkouts: 0,
    weeklyConsultations: 0,
    weeklyMeasurements: 0,
    previousWeeklyWorkouts: 0,
  });
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [workoutTrend, setWorkoutTrend] = useState<WorkoutTrend[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [trendDirection, setTrendDirection] = useState<"up" | "down" | "same">(
    "same",
  );
  const [trendPercentage, setTrendPercentage] = useState(0);

  const locale = pathname?.split("/")[1] || "hu";

  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndLoad() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push(`/${locale}/login`);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const { data: profile } = await supabase
            .from("coach_profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          if (profile?.full_name) {
            setUserName(profile.full_name);
          } else if (user.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name);
          } else if (user.email) {
            const name = user.email.split("@")[0];
            setUserName(name.charAt(0).toUpperCase() + name.slice(1));
          }
        }

        await Promise.all([
          fetchStats(session.user.id),
          fetchRecentClients(session.user.id),
          fetchWorkoutTrend(session.user.id),
          fetchRecentNotifications(session.user.id),
        ]);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuthAndLoad();
    return () => {
      isMounted = false;
    };
  }, [router, locale]);

  async function fetchStats(coachId: string) {
    const { count: clientsCount } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", coachId);

    const { count: plansCount } = await supabase
      .from("workout_plans")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", coachId)
      .eq("status", "active");

    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

    const { data: todayAppointments } = await supabase
      .from("appointments")
      .select("type")
      .eq("coach_id", coachId)
      .gte("start_time", today)
      .lt("start_time", tomorrow);

    const todayWorkouts =
      todayAppointments?.filter((a) => a.type === "workout").length || 0;
    const todayConsultations =
      todayAppointments?.filter((a) => a.type === "consultation").length || 0;
    const todayMeasurements =
      todayAppointments?.filter((a) => a.type === "measurement").length || 0;

    const weekStart = format(
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    );
    const weekEnd = format(
      endOfWeek(new Date(), { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    );

    const { data: weeklyAppointments } = await supabase
      .from("appointments")
      .select("type")
      .eq("coach_id", coachId)
      .gte("start_time", weekStart)
      .lte("start_time", weekEnd);

    const weeklyWorkouts =
      weeklyAppointments?.filter((a) => a.type === "workout").length || 0;
    const weeklyConsultations =
      weeklyAppointments?.filter((a) => a.type === "consultation").length || 0;
    const weeklyMeasurements =
      weeklyAppointments?.filter((a) => a.type === "measurement").length || 0;

    const prevWeekStart = format(subWeeks(new Date(), 1), "yyyy-MM-dd");
    const prevWeekEnd = format(subWeeks(new Date(), 1), "yyyy-MM-dd");

    const { data: prevWeeklyAppointments } = await supabase
      .from("appointments")
      .select("type")
      .eq("coach_id", coachId)
      .eq("type", "workout")
      .gte("start_time", prevWeekStart)
      .lte("start_time", prevWeekEnd);

    const prev = prevWeeklyAppointments?.length || 0;
    const current = weeklyWorkouts;

    if (prev > 0) {
      const change = ((current - prev) / prev) * 100;
      setTrendPercentage(Math.round(Math.abs(change)));
      setTrendDirection(change > 0 ? "up" : change < 0 ? "down" : "same");
    } else if (current > 0) {
      setTrendDirection("up");
      setTrendPercentage(100);
    }

    setStats({
      totalClients: clientsCount || 0,
      activePlans: plansCount || 0,
      todayWorkouts,
      todayConsultations,
      todayMeasurements,
      weeklyWorkouts,
      weeklyConsultations,
      weeklyMeasurements,
      previousWeeklyWorkouts: prev,
    });
  }

  async function fetchRecentClients(coachId: string) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, full_name, email, phone, status, created_at")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentClients(clients || []);
  }

  async function fetchWorkoutTrend(coachId: string) {
    const trendData: WorkoutTrend[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const nextDayStr = format(
        new Date(date.getTime() + 86400000),
        "yyyy-MM-dd",
      );

      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", coachId)
        .eq("type", "workout")
        .gte("start_time", dateStr)
        .lt("start_time", nextDayStr);

      trendData.push({
        date: format(date, "MMM dd", { locale: hu }),
        count: count || 0,
      });
    }
    setWorkoutTrend(trendData);
  }

  async function fetchRecentNotifications(userId: string) {
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(3);

    setRecentNotifications(notifications || []);
  }

  const getTrendIcon = () => {
    if (trendDirection === "up")
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trendDirection === "down")
      return <TrendingDown className="h-4 w-4 text-rose-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getTrendColor = () => {
    if (trendDirection === "up") return "text-emerald-600 bg-emerald-50";
    if (trendDirection === "down") return "text-rose-600 bg-rose-50";
    return "text-slate-500 bg-slate-50";
  };

  const maxWorkoutCount = Math.max(...workoutTrend.map((w) => w.count), 1);
  const chartHeight = 40;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex flex-col justify-center items-center gap-4 p-6 pt-24 lg:pt-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-slate-500 mt-4 font-medium animate-pulse">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      <Sidebar />

      {/* Javított felső padding a mobil navbarhoz (pt-20) és overflow védelem */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-6 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-10 space-y-6">
          {/* Cím és Státusz */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                {t("title")}
              </h1>
              <p className="text-slate-500 mt-1 sm:mt-2 text-base sm:text-lg">
                {t("welcome")}{" "}
                <span className="text-indigo-600 font-semibold">
                  {userName}
                </span>
                ! 👋
              </p>
            </div>

            <div className="self-start sm:self-auto flex items-center gap-2 text-xs sm:text-sm font-medium bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-slate-600">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {t("systemStatus")}
            </div>
          </div>

          {/* Fő statisztikák grid - Mobilon 1 oszlopos törés a torzulások ellen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
                  {t("totalClients")}
                </CardTitle>
                <Users className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {stats.totalClients}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                  {t("activeClientsCount")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
                  {t("activePlans")}
                </CardTitle>
                <Activity className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {stats.activePlans}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                  {t("activePlansCount")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
                  {t("weeklyWorkouts")}
                </CardTitle>
                <Dumbbell className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">
                    {stats.weeklyWorkouts}
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getTrendColor()}`}
                  >
                    {getTrendIcon()}
                    {trendDirection !== "same" && (
                      <span>{trendPercentage}%</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                  {t("previousWeek")} {stats.previousWeeklyWorkouts}{" "}
                  {t("workouts")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Napi lebontás - Mobilon 1 oszlopos elrendezés */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
                  💪 {t("todayWorkouts")}
                </CardTitle>
                <Dumbbell className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {stats.todayWorkouts}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
                  💬 {t("todayConsultations")}
                </CardTitle>
                <MessageCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {stats.todayConsultations}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
                  📏 {t("todayMeasurements")}
                </CardTitle>
                <Stethoscope className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {stats.todayMeasurements}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grafikon és Értesítések */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1 lg:col-span-2 border-none shadow-sm w-full overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {t("workoutTrend")}
                    </CardTitle>
                    <CardDescription>
                      {t("workoutTrendDescription")}
                    </CardDescription>
                  </div>
                  <TrendingUp className="h-5 w-5 text-slate-300" />
                </div>
              </CardHeader>
              <CardContent>
                {/* Biztonságos belső görgető sáv a grafikonnak mobilon */}
                <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                  <div className="flex items-end gap-2 h-32 min-w-[340px] pt-4">
                    {workoutTrend.map((day, idx) => {
                      const height =
                        day.count === 0
                          ? 4
                          : (day.count / maxWorkoutCount) * chartHeight;
                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          <div
                            className="w-full bg-indigo-100 rounded-lg transition-all duration-300 hover:bg-indigo-200 cursor-pointer"
                            style={{ height: `${Math.max(height, 4)}px` }}
                          >
                            <div
                              className="bg-indigo-500 rounded-lg transition-all duration-300"
                              style={{ height: `${height}px`, width: "100%" }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 select-none whitespace-nowrap">
                            {day.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t text-center">
                  <p className="text-xs text-slate-400">
                    {t("totalWorkouts")}{" "}
                    {workoutTrend.reduce((sum, d) => sum + d.count, 0)}{" "}
                    {t("workoutsInLast7Days")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hidden lg:block border-none shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {t("notifications")}
                    </CardTitle>
                    <CardDescription>
                      {t("recentNotifications")}
                    </CardDescription>
                  </div>
                  <Bell className="h-5 w-5 text-slate-300" />
                </div>
              </CardHeader>
              <CardContent>
                {recentNotifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t("noNotifications")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="p-1.5 bg-indigo-50 rounded-lg shrink-0">
                          <Bell className="h-3 w-3 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {format(
                              new Date(notif.created_at),
                              "MMM dd, HH:mm",
                              { locale: hu },
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Link href={`/${locale}/notifications`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50"
                      >
                        {t("viewAll")}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Kliensek szekció */}
          {stats.totalClients > 0 ? (
            <div className="pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {t("recentClients")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {t("recentClientsDescription", {
                      count: recentClients.length,
                    })}
                  </p>
                </div>
                <Link
                  href={`/${locale}/clients`}
                  className="self-start sm:self-auto"
                >
                  <Button
                    variant="ghost"
                    className="text-indigo-600 hover:text-indigo-700 gap-1 pl-0 sm:pl-4"
                  >
                    {t("viewAllClients")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentClients.map((client) => (
                  <Link
                    href={`/${locale}/clients/${client.id}`}
                    key={client.id}
                  >
                    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-200 cursor-pointer group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {client.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                {client.full_name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {client.email && (
                                  <span className="text-xs text-slate-400 truncate max-w-[120px] sm:max-w-none">
                                    {client.email}
                                  </span>
                                )}
                                {client.status === "active" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                                    <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                    {t("active")}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                    {t("inactive")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <User className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-4 relative overflow-hidden bg-slate-900 rounded-3xl p-6 sm:p-8 md:p-12 text-white shadow-2xl shadow-indigo-200">
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="max-w-xl text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-500/30">
                    <TrendingUp className="h-3 w-3" />
                    {t("seasonStart")}
                  </div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    {t("startNewSeason")}
                  </h3>
                  <p className="text-slate-400 text-sm sm:text-base md:text-lg mb-0">
                    {t("startNewSeasonDescription")}
                  </p>
                </div>

                <div className="shrink-0 w-full lg:w-auto">
                  <Link href={`/${locale}/clients`}>
                    <button className="w-full lg:w-auto bg-white text-slate-900 hover:bg-indigo-50 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2">
                      <Plus className="h-5 w-5" />
                      {t("addFirstClient")}
                    </button>
                  </Link>
                </div>
              </div>

              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
