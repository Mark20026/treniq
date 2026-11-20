import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../services/i18n";

interface Exercise {
  id: string;
  name: string;
  category: string;
  sets: number;
  min_reps: number;
  max_reps: number;
  weight: number | null;
  day_of_week: number;
  rest_time: number;
  notes: string | null;
}

interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  weekly_frequency: number;
  status: string;
  exercises: Exercise[];
}

export default function WorkoutPlansScreen() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  useEffect(() => {
    fetchPlans();
    const unsubscribe = subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, []),
  );

  async function fetchPlans() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("workout_plans")
        .select(
          `
          *,
          exercises (
            id,
            name,
            category,
            sets,
            min_reps,
            max_reps,
            weight,
            day_of_week,
            rest_time,
            notes
          )
        `,
        )
        .eq("client_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlans(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || t("errors:generic"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return t("workout:difficulty.beginner");
      case "intermediate":
        return t("workout:difficulty.intermediate");
      case "advanced":
        return t("workout:difficulty.advanced");
      default:
        return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "#10B981";
      case "intermediate":
        return "#F59E0B";
      case "advanced":
        return "#EF4444";
      default:
        return "#64748B";
    }
  };

  const getCategoryIcon = (category: string): any => {
    switch (category) {
      case "chest":
        return "barbell-outline";
      case "back":
        return "barbell-outline";
      case "legs":
        return "barbell-outline";
      case "shoulders":
        return "barbell-outline";
      case "arms":
        return "barbell-outline";
      case "cardio":
        return "heart-outline";
      case "core":
        return "fitness-outline";
      default:
        return "barbell-outline";
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlans}>
          <Text style={styles.retryButtonText}>{t("common:refresh")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("workout:title")}</Text>
          <Text style={styles.headerSubtitle}>
            {plans.length} {t("workout:activePlans")}
          </Text>
        </View>

        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="barbell-outline" size={32} color="#475569" />
            </View>
            <Text style={styles.emptyTitle}>{t("workout:noPlans")}</Text>
            <Text style={styles.emptyText}>
              {t("workout:noPlansDesc") ||
                "Az edződ még nem osztott meg veled edzéstervet."}
            </Text>
          </View>
        ) : (
          plans.map((plan) => {
            const exerciseCount = plan.exercises?.length || 0;
            const totalSets =
              plan.exercises?.reduce((sum, ex) => sum + ex.sets, 0) || 0;

            return (
              <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() => router.push(`/(app)/workout-plans/${plan.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName} numberOfLines={1}>
                    {plan.name}
                  </Text>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(plan.difficulty) },
                    ]}
                  >
                    <Text style={styles.difficultyBadgeText}>
                      {getDifficultyLabel(plan.difficulty)}
                    </Text>
                  </View>
                </View>

                {plan.description && (
                  <Text style={styles.planDescription} numberOfLines={2}>
                    {plan.description}
                  </Text>
                )}

                <View style={styles.planStats}>
                  <View style={styles.statItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#64748B"
                    />
                    <Text style={styles.statText}>
                      {plan.weekly_frequency} {t("workout:frequency")}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons
                      name="barbell-outline"
                      size={14}
                      color="#64748B"
                    />
                    <Text style={styles.statText}>
                      {exerciseCount} {t("workout:exercises")}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="repeat-outline" size={14} color="#64748B" />
                    <Text style={styles.statText}>
                      {totalSets} {t("workout:sets")}
                    </Text>
                  </View>
                </View>

                <View style={styles.planFooter}>
                  <View style={styles.dayIndicators}>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                      const hasExercise = plan.exercises?.some(
                        (ex) => ex.day_of_week === day,
                      );
                      return (
                        <View
                          key={day}
                          style={[
                            styles.dayDot,
                            hasExercise && styles.dayDotActive,
                          ]}
                        />
                      );
                    })}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#475569" />
                </View>
              </TouchableOpacity>
            );
          })
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
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
    paddingHorizontal: 24,
    gap: 12,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#111726",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#182235",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
  },
  planCard: {
    backgroundColor: "#131C2E",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC",
    flex: 1,
    marginRight: 10,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  planDescription: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 18,
  },
  planStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1C2638",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  planFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayIndicators: {
    flexDirection: "row",
    gap: 6,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1C2638",
  },
  dayDotActive: {
    backgroundColor: "#38BDF8",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: "#38BDF8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#090D16",
    fontWeight: "700",
    fontSize: 14,
  },
});
