import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import * as Notifications from "expo-notifications";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../services/i18n";

const { width: screenWidth } = Dimensions.get("window");

interface Measurement {
  id: string;
  measured_at: string;
  weight: number | string | null;
  body_fat: number | string | null;
  muscle_mass: number | string | null;
  chest: number | string | null;
  waist: number | string | null;
  hips: number | string | null;
  arm_left: number | string | null;
  arm_right: number | string | null;
  thigh_left: number | string | null;
  thigh_right: number | string | null;
  notes: string | null;
}

const toNumber = (value: number | string | null): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const formatNumber = (value: number | string | null): string => {
  const num = toNumber(value);
  if (num === null) return "-";
  return num.toFixed(1);
};

export default function MeasurementsScreen() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<
    "weight" | "bodyFat" | "muscle"
  >("weight");
  const [weightGoal, setWeightGoal] = useState<number | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState("");
  const [stats, setStats] = useState({
    currentWeight: 0,
    weightChange: 0,
    currentBodyFat: 0,
    bodyFatChange: 0,
    currentMuscle: 0,
    muscleChange: 0,
    bestWeight: 0,
  });
  const [lastMeasurementDays, setLastMeasurementDays] = useState<number>(0);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  useEffect(() => {
    fetchMeasurements();
    fetchWeightGoal();

    const unsubscribe = subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchMeasurements();
      fetchWeightGoal();
    }, []),
  );

  async function fetchWeightGoal() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .select("weight_goal")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching weight goal:", error);
        return;
      }

      setWeightGoal(toNumber(data?.weight_goal));
    } catch (error) {
      console.error("Fetch weight goal error:", error);
    }
  }

  async function updateWeightGoal() {
    const goal = parseFloat(tempGoal);
    if (isNaN(goal)) {
      Alert.alert(t("errors:generic"), t("common:invalidNumber"));
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert(t("errors:generic"), t("errors:unauthorized"));
      return;
    }

    const { error } = await supabase.from("clients").upsert(
      {
        id: user.id,
        weight_goal: goal,
        full_name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Kliens",
        email: user.email,
        status: "active",
      },
      { onConflict: "id", ignoreDuplicates: false },
    );

    if (error) {
      console.error("Upsert error:", error);
      Alert.alert(t("errors:generic"), t("errors:generic"));
    } else {
      setWeightGoal(goal);
      setShowGoalModal(false);
      Alert.alert(t("common:success"), t("measurements:goalSet"));
      fetchWeightGoal();
    }
  }

  async function deleteWeightGoal() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("clients")
      .update({ weight_goal: null })
      .eq("id", user.id);

    if (error) {
      Alert.alert(t("errors:generic"), t("errors:generic"));
    } else {
      setWeightGoal(null);
      setShowGoalModal(false);
      Alert.alert(t("common:success"), t("measurements:goalDeleted"));
      fetchWeightGoal();
    }
  }

  async function fetchMeasurements() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("measurements")
        .select("*")
        .eq("client_id", user.id)
        .order("measured_at", { ascending: false });

      if (error) throw error;

      setMeasurements(data || []);

      if (data && data.length > 0) {
        const latest = data[0];
        const first = data[data.length - 1];

        const latestWeight = toNumber(latest.weight) || 0;
        const firstWeight = toNumber(first.weight) || 0;
        const latestBodyFat = toNumber(latest.body_fat) || 0;
        const firstBodyFat = toNumber(first.body_fat) || 0;
        const latestMuscle = toNumber(latest.muscle_mass) || 0;
        const firstMuscle = toNumber(first.muscle_mass) || 0;

        setStats({
          currentWeight: latestWeight,
          weightChange: latestWeight - firstWeight,
          currentBodyFat: latestBodyFat,
          bodyFatChange: latestBodyFat - firstBodyFat,
          currentMuscle: latestMuscle,
          muscleChange: latestMuscle - firstMuscle,
          bestWeight: Math.min(...data.map((m) => toNumber(m.weight) || 0)),
        });

        const lastDate = new Date(latest.measured_at);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setLastMeasurementDays(diffDays);
      }
    } catch (error) {
      console.error("Error fetching measurements:", error);
      Alert.alert(t("errors:generic"), t("errors:generic"));
    } finally {
      setLoading(false);
    }
  }

  const getChartData = () => {
    if (measurements.length === 0) return null;

    const sorted = [...measurements].reverse();
    const localeStr =
      currentLang === "hu" ? "hu-HU" : currentLang === "sk" ? "sk-SK" : "en-US";

    const labels = sorted.map((m) =>
      new Date(m.measured_at).toLocaleDateString(localeStr, {
        month: "short",
        day: "numeric",
      }),
    );

    let data: number[] = [];
    let color = "#38BDF8";
    let title = "";

    switch (activeChart) {
      case "weight":
        data = sorted.map((m) => toNumber(m.weight) || 0);
        color = "#38BDF8";
        title = t("measurements:weightChart");
        break;
      case "bodyFat":
        data = sorted.map((m) => toNumber(m.body_fat) || 0);
        color = "#10B981";
        title = t("measurements:bodyFatChart");
        break;
      case "muscle":
        data = sorted.map((m) => toNumber(m.muscle_mass) || 0);
        color = "#F59E0B";
        title = t("measurements:muscleChart");
        break;
    }

    return { labels, data, color, title };
  };

  const chartData = getChartData();

  const getSizeChanges = () => {
    if (measurements.length < 2) {
      return { chest: 0, waist: 0, hips: 0, armRight: 0, thighRight: 0 };
    }

    const latest = measurements[0];
    const first = measurements[measurements.length - 1];

    return {
      chest: (toNumber(latest.chest) || 0) - (toNumber(first.chest) || 0),
      waist: (toNumber(latest.waist) || 0) - (toNumber(first.waist) || 0),
      hips: (toNumber(latest.hips) || 0) - (toNumber(first.hips) || 0),
      armRight:
        (toNumber(latest.arm_right) || 0) - (toNumber(first.arm_right) || 0),
      thighRight:
        (toNumber(latest.thigh_right) || 0) -
        (toNumber(first.thigh_right) || 0),
    };
  };

  const sizeChanges = getSizeChanges();
  const hasAnySizeData = measurements.some(
    (m) =>
      toNumber(m.chest) !== null ||
      toNumber(m.waist) !== null ||
      toNumber(m.hips) !== null ||
      toNumber(m.arm_right) !== null ||
      toNumber(m.thigh_right) !== null,
  );

  const goalDistance = weightGoal ? stats.currentWeight - weightGoal : null;
  const isGoalAchieved = goalDistance !== null && goalDistance <= 0;

  async function scheduleMeasurementReminder() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + 7);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: t("measurements:reminderTitle"),
          body: t("measurements:reminderBody"),
          data: { type: "measurement" },
        },
        trigger: {
          date: triggerDate,
          repeats: true,
        } as any,
      });
      Alert.alert(t("common:reminder"), t("measurements:reminderSet"));
    } else {
      Alert.alert(t("errors:generic"), t("common:permissionRequired"));
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>
              {t("measurements:subtitle")}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => router.push("/(app)/measurements/add")}
          >
            <Ionicons name="add" size={22} color="#090D16" />
          </TouchableOpacity>
        </View>

        {/* Emlékeztető banner */}
        {lastMeasurementDays > 7 && (
          <TouchableOpacity
            style={styles.reminderBanner}
            onPress={scheduleMeasurementReminder}
          >
            <View style={styles.reminderIconContainer}>
              <Ionicons name="time" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.reminderText}>
              {t("measurements:daysSince", { count: lastMeasurementDays })}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Súlycél kártya */}
        <TouchableOpacity
          style={styles.goalCard}
          onPress={() => {
            setTempGoal(weightGoal?.toString() || "");
            setShowGoalModal(true);
          }}
        >
          <View style={styles.goalInfo}>
            <View style={styles.goalTitleRow}>
              <Ionicons name="trophy-outline" size={16} color="#94A3B8" />
              <Text style={styles.goalTitle}>
                {t("measurements:weightGoal")}
              </Text>
            </View>
            {weightGoal ? (
              <Text style={styles.goalValue}>
                {formatNumber(weightGoal)}{" "}
                <Text style={styles.unitText}>{t("common:kg")}</Text>
              </Text>
            ) : (
              <Text style={styles.goalPlaceholder}>
                {t("measurements:setGoal")}
              </Text>
            )}
          </View>
          {weightGoal && (
            <View
              style={[
                styles.goalBadge,
                isGoalAchieved ? styles.badgePositive : styles.badgeNegative,
              ]}
            >
              <Text
                style={[
                  styles.goalStatus,
                  isGoalAchieved ? styles.textPositive : styles.textNegative,
                ]}
              >
                {isGoalAchieved
                  ? `🎉 ${t("measurements:goalAchieved")}`
                  : `-${formatNumber(Math.abs(goalDistance!))} ${t("common:kg")}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {measurements.length > 0 ? (
          <>
            {/* Fő statisztikák Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t("measurements:weight")}</Text>
                <Text style={styles.statValue}>
                  {formatNumber(stats.currentWeight)}
                  <Text style={styles.statUnit}>{t("common:kg")}</Text>
                </Text>
                <View
                  style={[
                    styles.changeBadge,
                    stats.weightChange <= 0
                      ? styles.badgePositive
                      : styles.badgeNegative,
                  ]}
                >
                  <Text
                    style={[
                      styles.statChange,
                      stats.weightChange <= 0
                        ? styles.textPositive
                        : styles.textNegative,
                    ]}
                  >
                    {stats.weightChange > 0
                      ? `+${formatNumber(stats.weightChange)}`
                      : formatNumber(stats.weightChange)}
                  </Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>
                  {t("measurements:bodyFat")}
                </Text>
                <Text style={styles.statValue}>
                  {formatNumber(stats.currentBodyFat)}
                  <Text style={styles.statUnit}>%</Text>
                </Text>
                <View
                  style={[
                    styles.changeBadge,
                    stats.bodyFatChange <= 0
                      ? styles.badgePositive
                      : styles.badgeNegative,
                  ]}
                >
                  <Text
                    style={[
                      styles.statChange,
                      stats.bodyFatChange <= 0
                        ? styles.textPositive
                        : styles.textNegative,
                    ]}
                  >
                    {stats.bodyFatChange > 0
                      ? `+${formatNumber(stats.bodyFatChange)}`
                      : formatNumber(stats.bodyFatChange)}
                  </Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>
                  {t("measurements:muscleMass")}
                </Text>
                <Text style={styles.statValue}>
                  {formatNumber(stats.currentMuscle)}
                  <Text style={styles.statUnit}>{t("common:kg")}</Text>
                </Text>
                <View
                  style={[
                    styles.changeBadge,
                    stats.muscleChange >= 0
                      ? styles.badgePositive
                      : styles.badgeNegative,
                  ]}
                >
                  <Text
                    style={[
                      styles.statChange,
                      stats.muscleChange >= 0
                        ? styles.textPositive
                        : styles.textNegative,
                    ]}
                  >
                    {stats.muscleChange > 0
                      ? `+${formatNumber(stats.muscleChange)}`
                      : formatNumber(stats.muscleChange)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Grafikon szekció */}
            <View style={styles.chartCardContainer}>
              <View style={styles.chartTabs}>
                {(["weight", "bodyFat", "muscle"] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.chartTab,
                      activeChart === tab && styles.chartTabActive,
                    ]}
                    onPress={() => setActiveChart(tab)}
                  >
                    <Text
                      style={[
                        styles.chartTabText,
                        activeChart === tab && styles.chartTabTextActive,
                      ]}
                    >
                      {tab === "weight"
                        ? t("measurements:weight")
                        : tab === "bodyFat"
                          ? t("measurements:bodyFat")
                          : t("measurements:muscleMass")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {chartData && chartData.labels.length > 0 && (
                <View style={styles.chartWrapper}>
                  {chartData.labels.length === 1 ? (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>
                        {t("measurements:chartNeedsMoreData")}
                      </Text>
                    </View>
                  ) : (
                    <LineChart
                      data={{
                        labels: chartData.labels.slice(-5),
                        datasets: [
                          {
                            data: chartData.data.slice(-5),
                            color: () => chartData.color,
                          },
                        ],
                      }}
                      width={screenWidth - 48}
                      height={180}
                      chartConfig={{
                        backgroundGradientFrom: "#1E293B",
                        backgroundGradientTo: "#1E293B",
                        fillShadowGradientFrom: chartData.color,
                        fillShadowGradientTo: "transparent",
                        fillShadowGradientFromOpacity: 0.1,
                        decimalPlaces: 1,
                        color: (opacity = 1) => chartData.color,
                        labelColor: () => `#64748B`,
                        style: { borderRadius: 16 },
                        propsForBackgroundLines: {
                          strokeDasharray: "5",
                          stroke: "#334155",
                        },
                        propsForDots: {
                          r: "5",
                          strokeWidth: "2",
                          stroke: "#1E293B",
                        },
                      }}
                      bezier
                      style={styles.chart}
                      formatYLabel={(value) =>
                        `${parseFloat(value).toFixed(1)}`
                      }
                    />
                  )}
                </View>
              )}
            </View>

            {/* Testméret változások */}
            {measurements.length >= 2 && hasAnySizeData && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("measurements:circumferenceChanges")}
                </Text>
                <View style={styles.sizeGrid}>
                  {[
                    {
                      label: t("measurements:chest"),
                      val: sizeChanges.chest,
                      inverse: false,
                    },
                    {
                      label: t("measurements:waist"),
                      val: sizeChanges.waist,
                      inverse: true,
                    },
                    {
                      label: t("measurements:hips"),
                      val: sizeChanges.hips,
                      inverse: true,
                    },
                    {
                      label: t("measurements:armRight"),
                      val: sizeChanges.armRight,
                      inverse: false,
                    },
                    {
                      label: t("measurements:thighRight"),
                      val: sizeChanges.thighRight,
                      inverse: false,
                    },
                  ].map((item, idx) => {
                    const isPositiveOutcome = item.inverse
                      ? item.val <= 0
                      : item.val >= 0;
                    return (
                      <View key={idx} style={styles.sizeCard}>
                        <Text style={styles.sizeLabel}>{item.label}</Text>
                        <Text
                          style={[
                            styles.sizeValue,
                            isPositiveOutcome
                              ? styles.textPositive
                              : styles.textNegative,
                          ]}
                        >
                          {item.val > 0
                            ? `+${formatNumber(item.val)}`
                            : formatNumber(item.val)}{" "}
                          cm
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Mérési előzmények */}
            <View style={styles.logsContainer}>
              <Text style={styles.sectionTitle}>
                {t("measurements:history")}
              </Text>
              {measurements.map((measurement) => {
                const localeStr =
                  currentLang === "hu"
                    ? "hu-HU"
                    : currentLang === "sk"
                      ? "sk-SK"
                      : "en-US";
                return (
                  <View key={measurement.id} style={styles.logCard}>
                    <Text style={styles.logDate}>
                      {new Date(measurement.measured_at).toLocaleDateString(
                        localeStr,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </Text>
                    <View style={styles.logStats}>
                      {measurement.weight && (
                        <View style={styles.logStatItem}>
                          <Text style={styles.logStatValue}>
                            {formatNumber(measurement.weight)} {t("common:kg")}
                          </Text>
                          <Text style={styles.logStatLabel}>
                            {t("measurements:weight")}
                          </Text>
                        </View>
                      )}
                      {measurement.body_fat && (
                        <View style={styles.logStatItem}>
                          <Text style={styles.logStatValue}>
                            {formatNumber(measurement.body_fat)}%
                          </Text>
                          <Text style={styles.logStatLabel}>
                            {t("measurements:bodyFat")}
                          </Text>
                        </View>
                      )}
                      {measurement.muscle_mass && (
                        <View style={styles.logStatItem}>
                          <Text style={styles.logStatValue}>
                            {formatNumber(measurement.muscle_mass)}{" "}
                            {t("common:kg")}
                          </Text>
                          <Text style={styles.logStatLabel}>
                            {t("measurements:muscleMass")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="scale-outline" size={32} color="#64748B" />
            </View>
            <Text style={styles.emptyText}>{t("measurements:noData")}</Text>
            <Text style={styles.emptySubtext}>
              {t("measurements:addFirst")}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Súlycél beállító modal */}
      <Modal
        visible={showGoalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("measurements:setWeightGoal")}
              </Text>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setShowGoalModal(false)}
              >
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={tempGoal}
              onChangeText={setTempGoal}
              keyboardType="numeric"
              placeholder="75.0"
              placeholderTextColor="#64748B"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.modalCancelText}>{t("common:cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={updateWeightGoal}
              >
                <Text style={styles.modalSaveText}>{t("common:save")}</Text>
              </TouchableOpacity>
            </View>
            {weightGoal && (
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={deleteWeightGoal}
              >
                <Text style={styles.modalDeleteText}>{t("common:delete")}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090D16" },
  scrollContent: { paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  headerAddBtn: {
    backgroundColor: "#38BDF8",
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  reminderBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.15)",
  },
  reminderIconContainer: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    padding: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  reminderText: { flex: 1, fontSize: 13, color: "#F59E0B", fontWeight: "500" },
  goalCard: {
    backgroundColor: "#131C2E",
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalInfo: { flex: 1 },
  goalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  goalValue: { fontSize: 22, fontWeight: "700", color: "#F8FAFC" },
  unitText: { fontSize: 14, fontWeight: "400", color: "#64748B" },
  goalPlaceholder: { fontSize: 15, color: "#475569", fontWeight: "500" },
  goalBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  goalStatus: { fontSize: 13, fontWeight: "600" },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  statLabel: { fontSize: 12, fontWeight: "500", color: "#64748B" },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
    marginTop: 4,
  },
  statUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: "#64748B",
    marginLeft: 2,
  },
  changeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 8,
  },
  statChange: { fontSize: 11, fontWeight: "600" },
  badgePositive: { backgroundColor: "rgba(16, 185, 129, 0.1)" },
  badgeNegative: { backgroundColor: "rgba(239, 68, 68, 0.1)" },
  textPositive: { color: "#10B981" },
  textNegative: { color: "#EF4444" },
  chartCardContainer: {
    backgroundColor: "#131C2E",
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    paddingTop: 16,
    overflow: "hidden",
  },
  chartTabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#090D16",
    borderRadius: 12,
    padding: 4,
  },
  chartTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  chartTabActive: { backgroundColor: "#1E293B" },
  chartTabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chartTabTextActive: { color: "#38BDF8" },
  chartWrapper: { alignItems: "center", paddingBottom: 10 },
  chart: { marginRight: 16, marginTop: 8 },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
  },
  noDataText: { fontSize: 13, color: "#475569" },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  sizeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sizeCard: {
    width: (screenWidth - 68) / 3,
    backgroundColor: "#131C2E",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  sizeLabel: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  sizeValue: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  logsContainer: { paddingHorizontal: 24 },
  logCard: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logDate: { fontSize: 14, fontWeight: "600", color: "#F8FAFC", width: "30%" },
  logStats: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    marginLeft: 10,
  },
  logStatItem: { alignItems: "center", flex: 1 },
  logStatValue: { fontSize: 14, fontWeight: "700", color: "#F8FAFC" },
  logStatLabel: { fontSize: 11, color: "#64748B", marginTop: 2 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#131C2E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: { fontSize: 16, color: "#94A3B8", fontWeight: "600" },
  emptySubtext: {
    fontSize: 13,
    color: "#475569",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#131C2E",
    borderRadius: 24,
    padding: 24,
    width: "85%",
    borderWidth: 1,
    borderColor: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#F8FAFC" },
  closeModalBtn: { backgroundColor: "#090D16", padding: 6, borderRadius: 10 },
  modalInput: {
    backgroundColor: "#090D16",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: { color: "#94A3B8", fontSize: 15, fontWeight: "600" },
  modalSaveButton: {
    flex: 1,
    backgroundColor: "#38BDF8",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSaveText: { color: "#090D16", fontSize: 15, fontWeight: "700" },
  modalDeleteButton: { marginTop: 16, padding: 8, alignItems: "center" },
  modalDeleteText: { color: "#EF4444", fontSize: 13, fontWeight: "600" },
});
