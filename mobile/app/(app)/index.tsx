import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart } from "react-native-chart-kit";
import { t, getCurrentLanguage } from "../../services/i18n";

const { width: screenWidth }=Dimensions.get("window");

interface ExerciseProgress {
  name: string;
  improvement: number;
  currentValue: number;
  previousValue: number;
}

export default function DashboardScreen() {
  const [profile, setProfile]=useState<any>(null);
  const [loading, setLoading]=useState(true);
  const [refreshing, setRefreshing]=useState(false);
  const [stats, setStats]=useState({
    activePlans: 0,
    totalWorkouts: 0,
    workoutStreak: 0,
    weeklyWorkoutGoal: 4,
    weeklyWorkoutCompleted: 0,
  });
  const [weightData, setWeightData]=useState<{
    labels: string[];
    values: number[];
    goal: number|null;
    startWeight: number|null;
    currentWeight: number|null;
    change: number|null;
  }>({
    labels: [],
    values: [],
    goal: null,
    startWeight: null,
    currentWeight: null,
    change: null,
  });
  const [weeklyActivity, setWeeklyActivity]=useState<{
    labels: string[];
    values: number[];
    completed: number;
    total: number;
  }>({
    labels: ["H", "K", "Sze", "Cs", "P", "Szo", "V"],
    values: [0, 0, 0, 0, 0, 0, 0],
    completed: 0,
    total: 7,
  });
  const [exerciseProgress, setExerciseProgress]=useState<ExerciseProgress[]>(
    [],
  );

  const getWeekDays=React.useCallback(() => {
    const lang=getCurrentLanguage();
    switch (lang) {
      case "hu":
        return ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
      case "sk":
        return ["P", "U", "S", "Š", "P", "S", "N"];
      case "en":
        return ["M", "T", "W", "T", "F", "S", "S"];
      default:
        return ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
    }
  }, []);

  const fetchWeightData=React.useCallback(async function(userId: string, targetGoal: number|null) {
    const thirtyDaysAgo=new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30);

    const { data, error }=await supabase
      .from("measurements")
      .select("measured_at, weight")
      .eq("client_id", userId)
      .not("weight", "is", null)
      .gte("measured_at", thirtyDaysAgo.toISOString())
      .order("measured_at", { ascending: true });

    if (!error&&data&&data.length>0) {
      const labels=data.map((m) =>
        new Date(m.measured_at).toLocaleDateString("hu-HU", {
          month: "short",
          day: "numeric",
        }),
      );
      const values=data.map((m) => m.weight||0);
      const startWeight=values[0];
      const currentWeight=values[values.length-1];
      const change=currentWeight-startWeight;

      setWeightData({
        labels: labels.slice(-6),
        values: values.slice(-6),
        goal: targetGoal,
        startWeight,
        currentWeight,
        change,
      });
    } else {
      setWeightData((prev) => ({ ...prev, goal: targetGoal }));
    }
  }, []);

  const fetchWeeklyActivityOptimized=React.useCallback(async function(userId: string): Promise<number> {
    const today=new Date();
    const currentDay=today.getDay();
    const distanceToMonday=currentDay===0? 6:currentDay-1;

    const startOfWeek=new Date(today);
    startOfWeek.setDate(today.getDate()-distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const { data }=await supabase
      .from("workout_logs")
      .select("performed_at")

      .eq("client_id", userId)
      .gte("performed_at", startOfWeek.toISOString())
      .order("performed_at", { ascending: true });

    const weeklyData=[0, 0, 0, 0, 0, 0, 0];
    let completedDaysCount=0;

    if (data) {
      data.forEach((log) => {
        const logDate=new Date(log.performed_at);
        let logDay=logDate.getDay();
        let index=logDay===0? 6:logDay-1;
        if (index>=0&&index<7) {
          weeklyData[index]+=1;
        }
      });
      completedDaysCount=weeklyData.filter((count) => count>0).length;
    }

    const weekDays=getWeekDays();

    setWeeklyActivity({
      labels: weekDays,
      values: weeklyData,
      completed: completedDaysCount,
      total: 7,
    });

    return completedDaysCount;
  }, [getWeekDays]);

  const calculateWorkoutStreak=React.useCallback(async function(userId: string): Promise<number> {
    const { data, error }=await supabase
      .from("workout_logs")
      .select("performed_at")

      .eq("client_id", userId)
      .order("performed_at", { ascending: false });

    if (error||!data||data.length===0) return 0;

    let streak=0;
    let currentDate=new Date();
    currentDate.setHours(0, 0, 0, 0);

    const uniqueDays=Array.from(
      new Set(
        data.map((log) => {
          const d=new Date(log.performed_at);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }),
      ),
    );

    for (let i=0;i<uniqueDays.length;i++) {
      const logDay=new Date(uniqueDays[i]);
      const diffTime=Math.abs(currentDate.getTime()-logDay.getTime());
      const diffDays=Math.ceil(diffTime/(1000*60*60*24));

      if (diffDays===streak||diffDays===streak+1) {
        streak=diffDays;
      } else {
        break;
      }
    }

    return streak;
  }, []);

  const fetchExerciseProgress=React.useCallback(async function(userId: string) {
    const { data, error }=await supabase
      .from("workout_log_exercises")
      .select(
        `
        exercise_name,
        weight_used,
        created_at,
        workout_log:workout_logs (performed_at, client_id)
      `,
      )
      .not("weight_used", "is", null)
      .order("created_at", { ascending: false });

    if (error||!data) return;

    const clientData=data.filter(
      (item: any) => item.workout_log?.client_id===userId,
    );
    const exerciseMap=new Map<
      string,
      { first: number; last: number; name: string }
    >();

    for (const item of clientData) {
      const rawWeight=String(item.weight_used).split(",")[0]||"0";
      const weight=parseFloat(rawWeight.replace(/[^0-9.]/g, ""))||0;
      if (weight===0) continue;

      if (!exerciseMap.has(item.exercise_name)) {
        exerciseMap.set(item.exercise_name, {
          first: weight,
          last: weight,
          name: item.exercise_name,
        });
      } else {
        const existing=exerciseMap.get(item.exercise_name)!;
        existing.last=weight;
        exerciseMap.set(item.exercise_name, existing);
      }
    }

    const progresses: ExerciseProgress[]=[];
    for (const [_, d] of exerciseMap) {
      const improvement=d.first-d.last;
      if (improvement>0) {
        progresses.push({
          name: d.name,
          improvement,
          currentValue: d.first,
          previousValue: d.last,
        });
      }
    }

    progresses.sort((a, b) => b.improvement-a.improvement);
    setExerciseProgress(progresses.slice(0, 3));
  }, []);

  const fetchData=React.useCallback(async function() {

    return Promise.resolve(supabase.auth.getUser()).then(async (loaded) => {
      const {
        data: { user },
      }=loaded;


      if (user) {
        const { data: clientData }=await supabase
          .from("clients")
          .select("full_name, email, phone, weight_goal, weekly_goal")
          .eq("id", user.id)
          .maybeSingle();

        if (clientData&&clientData.full_name) {
          setProfile(clientData);
        } else {
          const { data: userData }=await supabase.auth.getUser();
          const fallbackName=
            userData.user?.user_metadata?.full_name||
            userData.user?.email?.split("@")[0]||
            "Kliens";
          setProfile({
            full_name: fallbackName,
            email: user.email,
            weight_goal: null,
            weekly_goal: 3,
          });
        }

        const { count: activePlans }=await supabase
          .from("workout_plans")
          .select("*", { count: "exact", head: true })
          .eq("client_id", user.id)
          .eq("status", "active");

        const { count: totalWorkouts }=await supabase
          .from("workout_logs")
          .select("*", { count: "exact", head: true })

          .eq("client_id", user.id);

        await fetchWeightData(user.id, clientData?.weight_goal||null);
        const weeklyCompletedCount=await fetchWeeklyActivityOptimized(
          user.id,
        );
        const streak=await calculateWorkoutStreak(user.id);
        await fetchExerciseProgress(user.id);

        setStats({
          activePlans: activePlans||0,
          totalWorkouts: totalWorkouts||0,
          workoutStreak: streak,
          weeklyWorkoutGoal: clientData?.weekly_goal||3,
          weeklyWorkoutCompleted: weeklyCompletedCount,
        });
      }

    }).catch(async (error) => {
      console.error("Dashboard hiba:", error);
    }).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, [fetchWeightData, fetchWeeklyActivityOptimized, calculateWorkoutStreak, fetchExerciseProgress]);

  const onRefresh=() => {
    setRefreshing(true);
    fetchData();
  };

  const getChangeColor=(change: number|null) => {
    if (!change) return "#94A3B8";
    if (change>0) return "#F43F5E";
    if (change<0) return "#10B981";
    return "#EAB308";
  };

  const getWeightProgressPercentage=() => {
    if (
      !weightData.startWeight||
      !weightData.currentWeight||
      !weightData.goal
    )
      return 0;
    const totalNeeded=weightData.startWeight-weightData.goal;
    if (totalNeeded===0) return 100;
    const currentProgress=weightData.startWeight-weightData.currentWeight;
    const pct=Math.round((currentProgress/totalNeeded)*100);
    return Math.max(0, Math.min(pct, 100));
  };


  useEffect(() => {
    fetchData();
  }, [fetchData]);


  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  const chartConfig={
    backgroundColor: "#0F172A",
    backgroundGradientFrom: "#1E293B",
    backgroundGradientTo: "#0F172A",
    decimalPlaces: 1,
    color: (opacity=1) => `rgba(56, 189, 248, ${opacity})`,
    labelColor: (opacity=1) => `rgba(148, 163, 184, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#38BDF8" },
  };

  const barChartConfig={
    ...chartConfig,
    color: (opacity=1) => `rgba(16, 185, 129, ${opacity})`,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t("dashboard:greeting")}</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {profile?.full_name?.split(" ")[0]||"Sportoló"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileNotification}
            onPress={() => router.push("/(app)/profile")}
          >
            <Ionicons name="person-circle-outline" size={36} color="#38BDF8" />
          </TouchableOpacity>
        </View>

        {/* 2x2 Statisztikai Grid - JAVÍTVA DIZÁJN */}
        <View style={styles.statGrid}>
          {/* Streak */}
          <View
            style={[
              styles.statBox,
              { borderTopColor: "#F59E0B", borderTopWidth: 3 },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: "rgba(245, 158, 11, 0.12)" },
              ]}
            >
              <Ionicons name="flame" size={20} color="#F59E0B" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                {stats.workoutStreak}
              </Text>
              <Text style={styles.statLabel}>
                {t("dashboard:workoutStreak")}
              </Text>
            </View>
          </View>

          {/* Heti cél */}
          <View
            style={[
              styles.statBox,
              { borderTopColor: "#10B981", borderTopWidth: 3 },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: "rgba(16, 185, 129, 0.12)" },
              ]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statValue, { color: "#10B981" }]}>
                {stats.weeklyWorkoutCompleted}/{stats.weeklyWorkoutGoal}
              </Text>
              <Text style={styles.statLabel}>{t("dashboard:weeklyGoal")}</Text>
            </View>
          </View>

          {/* Aktív tervek */}
          <View
            style={[
              styles.statBox,
              { borderTopColor: "#38BDF8", borderTopWidth: 3 },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: "rgba(56, 189, 248, 0.12)" },
              ]}
            >
              <Ionicons name="barbell" size={20} color="#38BDF8" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statValue, { color: "#38BDF8" }]}>
                {stats.activePlans}
              </Text>
              <Text style={styles.statLabel}>{t("dashboard:activePlans")}</Text>
            </View>
          </View>

          {/* Összes edzés */}
          <View
            style={[
              styles.statBox,
              { borderTopColor: "#8B5CF6", borderTopWidth: 3 },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: "rgba(139, 92, 246, 0.12)" },
              ]}
            >
              <Ionicons name="trophy" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statValue, { color: "#8B5CF6" }]}>
                {stats.totalWorkouts}
              </Text>
              <Text style={styles.statLabel}>
                {t("dashboard:totalWorkouts")}
              </Text>
            </View>
          </View>
        </View>

        {/* Súly trend grafikon */}
        {weightData.values.length>0&&(
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>
                  📉 {t("dashboard:weightTrend")}
                </Text>
              </View>
              <View
                style={[
                  styles.weightChangeContainer,
                  { backgroundColor: getChangeColor(weightData.change)+"20" },
                ]}
              >
                <Ionicons
                  name={
                    weightData.change&&weightData.change>0
                      ? "arrow-up"
                      :"arrow-down"
                  }
                  size={14}
                  color={getChangeColor(weightData.change)}
                />
                <Text
                  style={[
                    styles.weightChange,
                    { color: getChangeColor(weightData.change) },
                  ]}
                >
                  {weightData.change&&weightData.change>0? "+":""}
                  {weightData.change
                    ? `${weightData.change.toFixed(1)} kg`
                    :"0 kg"}
                </Text>
              </View>
            </View>

            <LineChart
              data={{
                labels: weightData.labels,
                datasets: [{ data: weightData.values }],
              }}
              width={screenWidth-40}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              formatYLabel={(value) => `${parseFloat(value).toFixed(0)} kg`}
            />

            {weightData.goal&&(
              <View style={styles.goalContainer}>
                <View style={styles.goalRow}>
                  <Text style={styles.goalText}>
                    🎯 {t("profile:weightGoal")}: {weightData.goal} kg
                  </Text>
                  <Text style={styles.goalPercentageText}>
                    {getWeightProgressPercentage()}%
                  </Text>
                </View>
                <View style={styles.goalProgressBarBackground}>
                  <View
                    style={[
                      styles.goalProgressBarFill,
                      { width: `${getWeightProgressPercentage()}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Heti aktivitás oszlopdiagram */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>
                📅 {t("dashboard:weeklyActivity")}
              </Text>
            </View>
            <View style={styles.weeklyPercentage}>
              <Text style={styles.weeklyPercentageText}>
                {Math.round((weeklyActivity.completed/7)*100)}%
              </Text>
            </View>
          </View>
          <BarChart yAxisLabel="" yAxisSuffix=""
            data={{
              labels: weeklyActivity.labels,
              datasets: [{ data: weeklyActivity.values }],
            }}
            width={screenWidth-40}
            height={160}
            chartConfig={barChartConfig}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars={false}
          />
        </View>

        {/* Erőnlét fejlődés */}
        {exerciseProgress.length>0&&(
          <View style={styles.progressCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>
                  💪 {t("dashboard:strengthProgress")}
                </Text>
              </View>
              <Ionicons name="trending-up-outline" size={22} color="#10B981" />
            </View>
            {exerciseProgress.map((exercise, idx) => (
              <View key={idx} style={styles.progressItem}>
                <View style={styles.progressItemHeader}>
                  <Text style={styles.progressItemName} numberOfLines={1}>
                    {exercise.name}
                  </Text>
                  <Text style={styles.progressItemValue}>
                    +{exercise.improvement} kg
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min((exercise.improvement/exercise.previousValue)*150, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressItemFooter}>
                  <Text style={styles.progressItemPrev}>
                    {t("common:start")}: {exercise.previousValue} kg
                  </Text>
                  <Text style={styles.progressItemCurrent}>
                    {t("common:now")}: {exercise.currentValue} kg
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Navigációs szekció */}
        <View style={styles.navSection}>
          <Text style={styles.navSectionTitle}>{t("common:quickAccess")}</Text>
          <View style={styles.menuGrid}>
            {[
              {
                path: "/(app)/schedule",
                label: t("navigation:schedule"),
                icon: "calendar-outline",
              },
              {
                path: "/(app)/workout-plans",
                label: t("navigation:workoutPlans"),
                icon: "barbell-outline",
              },
              {
                path: "/(app)/meal-plans",
                label: t("navigation:mealPlans"),
                icon: "restaurant-outline",
              },
              {
                path: "/(app)/progress",
                label: t("navigation:progress"),
                icon: "analytics-outline",
              },
              {
                path: "/(app)/measurements",
                label: t("navigation:measurements"),
                icon: "scale-outline",
              },
              {
                path: "/(app)/chat",
                label: t("navigation:chat"),
                icon: "chatbubbles-outline",
              },
              {
                path: "/(app)/files",
                label: t("navigation:files"),
                icon: "folder-open-outline",
              },
              {
                path: "/(app)/profile",
                label: t("navigation:profile"),
                icon: "person-outline",
              },
              {
                path: "/(app)/notifications",
                label: "Értesítések",
                icon: "notifications-outline",
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => router.push(item.path as any)}
                activeOpacity={0.65}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name={item.icon as any} size={18} color="#38BDF8" />
                </View>
                <Text style={styles.menuTitle}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={14} color="#475569" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090D16" },
  scrollContent: { paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  nameEmoji: {
    fontSize: 20,
  },
  profileNotification: { padding: 4 },

  // Statisztikai Grid - ÚJ DIZÁJN
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  statBox: {
    backgroundColor: "#111827",
    width: (screenWidth-44)/2,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },

  chartCard: {
    backgroundColor: "#111827",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  chartTitle: { fontSize: 15, fontWeight: "600", color: "#F8FAFC" },
  chartSubtitle: { fontSize: 11, color: "#64748B", marginTop: 1 },
  weightChangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weightChange: { fontSize: 12, fontWeight: "600" },
  chart: { marginLeft: -18, marginTop: 4, borderRadius: 16 },
  goalContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  goalText: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },
  goalPercentageText: { fontSize: 12, fontWeight: "700", color: "#38BDF8" },
  goalProgressBarBackground: {
    height: 6,
    backgroundColor: "#1F2937",
    borderRadius: 10,
    overflow: "hidden",
  },
  goalProgressBarFill: {
    height: "100%",
    backgroundColor: "#38BDF8",
    borderRadius: 10,
  },
  weeklyPercentage: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weeklyPercentageText: { fontSize: 12, fontWeight: "600", color: "#10B981" },
  progressCard: {
    backgroundColor: "#111827",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  progressItem: { marginTop: 12 },
  progressItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressItemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E2E8F0",
    flex: 1,
    marginRight: 8,
  },
  progressItemValue: { fontSize: 13, fontWeight: "700", color: "#10B981" },
  progressBar: {
    height: 5,
    backgroundColor: "#1F2937",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 5,
  },
  progressFill: { height: "100%", backgroundColor: "#10B981", borderRadius: 3 },
  progressItemFooter: { flexDirection: "row", justifyContent: "space-between" },
  progressItemPrev: { fontSize: 10, color: "#64748B" },
  progressItemCurrent: { fontSize: 10, color: "#94A3B8", fontWeight: "500" },
  navSection: { paddingHorizontal: 16, marginTop: 8 },
  navSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuGrid: { gap: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(56, 189, 248, 0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#F1F5F9",
    marginLeft: 12,
  },
});
