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
  StatusBar,
} from "react-native";
import { supabase } from "../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { t, getCurrentLanguage } from "../../services/i18n";

const { width: screenWidth } = Dimensions.get("window");

interface Exercise {
  id: string;
  name: string;
  category: string;
}

interface ExerciseLog {
  id: string;
  performed_at: string;
  sets_completed: number;
  reps_completed: string;
  weight_used: string | null;
  feeling: number | null;
}

export default function ProgressScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>("");
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: workoutLogs, error: logsError } = await supabase
        .from("workout_logs")
        .select("id, performed_at, feeling")

        .eq("client_id", user.id)
        .order("performed_at", { ascending: true });

      if (logsError) console.error("Workout logs error:", logsError);

      if (!workoutLogs || workoutLogs.length === 0) {
        setLoading(false);
        return;
      }

      const workoutLogIds = workoutLogs.map((wl) => wl.id);

      const { data: exerciseData, error: exerciseError } = await supabase
        .from("workout_log_exercises")
        .select("exercise_name")
        .in("workout_log_id", workoutLogIds);

      if (exerciseError) {
        console.error("Exercise error:", exerciseError);
        setLoading(false);
        return;
      }

      if (exerciseData && exerciseData.length > 0) {
        const uniqueNames = [
          ...new Set(exerciseData.map((item) => item.exercise_name)),
        ];

        const exerciseList: Exercise[] = uniqueNames.map((name, index) => ({
          id: index.toString(),
          name: name,
          category: "other",
        }));

        setExercises(exerciseList);

        if (exerciseList.length > 0) {
          setSelectedExerciseId(exerciseList[0].id);
          setSelectedExerciseName(exerciseList[0].name);
          await fetchExerciseLogsForExercise(
            user.id,
            workoutLogIds,
            exerciseList[0].name,
          );
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchExerciseLogsForExercise(
    userId: string,
    workoutLogIds: string[],
    exerciseName: string,
  ) {
    try {
      const { data, error } = await supabase
        .from("workout_log_exercises")
        .select(
          "id, sets_completed, reps_completed, weight_used, workout_log_id",
        )
        .in("workout_log_id", workoutLogIds)
        .eq("exercise_name", exerciseName);

      if (error) {
        console.error("Fetch exercise logs error:", error);
        return;
      }

      if (data && data.length > 0) {
        const { data: logsData } = await supabase
          .from("workout_logs")
          .select("id, performed_at, feeling")

          .in("id", workoutLogIds);

        const logMap = new Map();
        logsData?.forEach((log) => {
          logMap.set(log.id, {
            performed_at: log.performed_at,
            feeling: log.feeling,
          });
        });

        const formattedLogs = data
          .map((item) => ({
            id: item.id,
            performed_at: logMap.get(item.workout_log_id)?.performed_at || "",
            sets_completed: item.sets_completed,
            reps_completed: item.reps_completed,
            weight_used: item.weight_used,
            feeling: logMap.get(item.workout_log_id)?.feeling || null,
          }))
          .filter((log) => log.performed_at);

        formattedLogs.sort(
          (a, b) =>
            new Date(a.performed_at).getTime() -
            new Date(b.performed_at).getTime(),
        );
        setLogs(formattedLogs);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching exercise logs:", error);
    }
  }

  useEffect(() => {
    if (selectedExerciseName) {
      refreshLogsForSelectedExercise();
    }
  }, [selectedExerciseName]);

  async function refreshLogsForSelectedExercise() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !selectedExerciseName) return;

    const { data: workoutLogs } = await supabase
      .from("workout_logs")
      .select("id")

      .eq("client_id", user.id);

    if (workoutLogs && workoutLogs.length > 0) {
      const workoutLogIds = workoutLogs.map((wl) => wl.id);
      await fetchExerciseLogsForExercise(
        user.id,
        workoutLogIds,
        selectedExerciseName,
      );
    }
  }

  const getChartData = () => {
    if (logs.length === 0) return null;

    const recentLogs = logs.slice(-6);
    const localeStr =
      getCurrentLanguage() === "hu"
        ? "hu-HU"
        : getCurrentLanguage() === "sk"
          ? "sk-SK"
          : "en-US";

    const labels = recentLogs.map((log) =>
      new Date(log.performed_at).toLocaleDateString(localeStr, {
        month: "short",
        day: "numeric",
      }),
    );

    const weights = recentLogs.map((log) => {
      const weightsArray = log.weight_used?.split(",").map(Number) || [0];
      return Math.max(...weightsArray);
    });

    return { labels, weights };
  };

  const getBestWeight = (): number => {
    if (logs.length === 0) return 0;
    const allWeights = logs.flatMap(
      (log) => log.weight_used?.split(",").map(Number) || [0],
    );
    return Math.max(...allWeights);
  };

  const getTotalWorkouts = (): number => logs.length;
  const getTotalSets = (): number =>
    logs.reduce((sum, log) => sum + log.sets_completed, 0);

  const getLastWeight = (): number => {
    const lastLog = logs[logs.length - 1];
    if (!lastLog?.weight_used) return 0;
    const weights = lastLog.weight_used.split(",").map(Number);
    return Math.max(...weights);
  };

  const getFirstWeight = (): number => {
    const firstLog = logs[0];
    if (!firstLog?.weight_used) return 0;
    const weights = firstLog.weight_used.split(",").map(Number);
    return Math.max(...weights);
  };

  const getChange = (): number => {
    const first = getFirstWeight();
    const last = getLastWeight();
    if (first === 0 || last === 0) return 0;
    return parseFloat((((last - first) / first) * 100).toFixed(1));
  };

  const renderFeelingIndicator = (feeling: number | null) => {
    let color = "#10B981";
    let bg = "rgba(16, 185, 129, 0.1)";
    let icon: "happy-outline" | "remove-circle-outline" | "sad-outline" =
      "happy-outline";

    if (feeling && feeling < 6) {
      color = "#EF4444";
      bg = "rgba(239, 68, 68, 0.1)";
      icon = "sad-outline";
    } else if (feeling && feeling < 8) {
      color = "#F59E0B";
      bg = "rgba(245, 158, 11, 0.1)";
      icon = "remove-circle-outline";
    }

    return (
      <View style={[styles.feelingDot, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
    );
  };

  const selectedExerciseDisplay =
    exercises.find((e) => e.id === selectedExerciseId)?.name ||
    selectedExerciseName;
  const chartData = getChartData();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  if (exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="analytics-outline" size={40} color="#38BDF8" />
          </View>
          <Text style={styles.emptyTitle}>{t("progress:emptyTitle")}</Text>
          <Text style={styles.emptyText}>{t("progress:emptyText")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gyakorlat Választó Fix Panel */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>
          {t("progress:selectedExercise")}
        </Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowDropdown(!showDropdown)}
          activeOpacity={0.8}
        >
          <Text style={styles.selectorText} numberOfLines={1}>
            {selectedExerciseDisplay}
          </Text>
          <Ionicons
            name={showDropdown ? "chevron-up" : "chevron-down"}
            size={18}
            color="#38BDF8"
          />
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdown}>
            <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled={true}>
              {exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={[
                    styles.dropdownItem,
                    selectedExerciseId === exercise.id &&
                      styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedExerciseId(exercise.id);
                    setSelectedExerciseName(exercise.name);
                    setShowDropdown(false);
                    refreshLogsForSelectedExercise();
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedExerciseId === exercise.id &&
                        styles.dropdownItemTextActive,
                    ]}
                  >
                    {exercise.name}
                  </Text>
                  {selectedExerciseId === exercise.id && (
                    <Ionicons name="checkmark" size={16} color="#38BDF8" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {logs.length > 0 ? (
          <>
            {/* Statisztikai rács */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{getTotalWorkouts()}</Text>
                <Text style={styles.statLabel}>{t("progress:workout")}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{getTotalSets()}</Text>
                <Text style={styles.statLabel}>{t("progress:sets")}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{getBestWeight()} kg</Text>
                <Text style={styles.statLabel}>{t("progress:maxWeight")}</Text>
              </View>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.changeBadge,
                    getChange() >= 0
                      ? styles.badgePositive
                      : styles.badgeNegative,
                  ]}
                >
                  <Text
                    style={[
                      styles.statValue,
                      getChange() >= 0 ? styles.positive : styles.negative,
                    ]}
                  >
                    {getChange() > 0 ? `+${getChange()}%` : `${getChange()}%`}
                  </Text>
                </View>
                <Text style={styles.statLabel}>
                  {t("progress:progressLabel")}
                </Text>
              </View>
            </View>

            {/* Grafikon */}
            {chartData && chartData.labels.length > 1 && (
              <View style={styles.chartContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trending-up" size={16} color="#64748B" />
                  <Text style={styles.sectionTitle}>
                    {t("progress:chartTitle")}
                  </Text>
                </View>
                <LineChart
                  data={{
                    labels: chartData.labels,
                    datasets: [{ data: chartData.weights }],
                  }}
                  width={screenWidth - 48}
                  height={180}
                  chartConfig={{
                    backgroundColor: "#131C2E",
                    backgroundGradientFrom: "#131C2E",
                    backgroundGradientTo: "#131C2E",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      `rgba(100, 116, 139, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: "#090D16",
                    },
                    backgroundGradientFromOpacity: 0,
                    backgroundGradientToOpacity: 0,
                    propsForBackgroundLines: {
                      strokeDasharray: "4",
                      stroke: "rgba(30, 41, 59, 0.5)",
                    },
                  }}
                  bezier
                  style={styles.chart}
                  formatYLabel={(value) => `${parseFloat(value).toFixed(0)}kg`}
                />
              </View>
            )}

            {/* Előzmények lista */}
            <View style={styles.logsContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={16} color="#64748B" />
                <Text style={styles.sectionTitle}>
                  {t("progress:historyTitle")}
                </Text>
              </View>

              {logs
                .slice()
                .reverse()
                .map((log) => {
                  const weights = log.weight_used?.split(",").map(Number) || [];
                  const maxWeight = Math.max(...weights);
                  const reps = log.reps_completed.split(",");
                  const localeStr =
                    getCurrentLanguage() === "hu"
                      ? "hu-HU"
                      : getCurrentLanguage() === "sk"
                        ? "sk-SK"
                        : "en-US";

                  return (
                    <View key={log.id} style={styles.logCard}>
                      <View style={styles.logHeader}>
                        <Text style={styles.logDate}>
                          {new Date(log.performed_at).toLocaleDateString(
                            localeStr,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </Text>
                        {renderFeelingIndicator(log.feeling)}
                      </View>

                      <View style={styles.logStats}>
                        <View style={styles.logStatItem}>
                          <Text style={styles.logStatValue}>
                            {log.sets_completed}
                          </Text>
                          <Text style={styles.logStatLabel}>
                            {t("progress:sets")}
                          </Text>
                        </View>
                        <View style={styles.logStatItem}>
                          <Text style={styles.logStatValue} numberOfLines={1}>
                            {reps.map((r) => r.trim()).join(", ")}
                          </Text>
                          <Text style={styles.logStatLabel}>
                            {t("progress:repsLabel")}
                          </Text>
                        </View>
                        {maxWeight > 0 && (
                          <View style={styles.logStatItem}>
                            <Text
                              style={[
                                styles.logStatValue,
                                { color: "#38BDF8" },
                              ]}
                            >
                              {maxWeight} kg
                            </Text>
                            <Text style={styles.logStatLabel}>
                              {t("progress:maxWeight")}
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
            <Text style={styles.emptyTextSmall}>
              {t("progress:emptyExerciseLogs")}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
  },
  selectorContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    zIndex: 999,
    backgroundColor: "#090D16",
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  selectorButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#131C2E",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  selectorText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
    flex: 1,
    marginRight: 8,
  },
  dropdown: {
    position: "absolute",
    top: 76,
    left: 24,
    right: 24,
    backgroundColor: "#131C2E",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  dropdownItemActive: {
    backgroundColor: "rgba(56, 189, 248, 0.04)",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#94A3B8",
    flex: 1,
    marginRight: 8,
  },
  dropdownItemTextActive: {
    color: "#38BDF8",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgePositive: { backgroundColor: "rgba(16, 185, 129, 0.08)" },
  badgeNegative: { backgroundColor: "rgba(239, 68, 68, 0.08)" },
  positive: { color: "#10B981" },
  negative: { color: "#EF4444" },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chartContainer: {
    backgroundColor: "#131C2E",
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  chart: {
    marginLeft: -16,
    borderRadius: 16,
    marginTop: 4,
  },
  logsContainer: {
    paddingHorizontal: 24,
  },
  logCard: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  logDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  feelingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(9, 13, 22, 0.4)",
    padding: 12,
    borderRadius: 12,
  },
  logStatItem: {
    flex: 1,
    alignItems: "center",
  },
  logStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  logStatLabel: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
    marginTop: 2,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#090D16",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(56, 189, 248, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.1)",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyTextSmall: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
});
