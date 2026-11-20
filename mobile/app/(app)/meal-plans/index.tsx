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

interface MealPlan {
  id: string;
  name: string;
  description: string | null;
  daily_calories: number | null;
  daily_protein: number | null;
  daily_carbs: number | null;
  daily_fat: number | null;
  status: string;
  created_at: string;
  shopping_list: string | null;
  notes: string | null;
}

export default function MealPlansScreen() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
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
        .from("meal_plans")
        .select("*")
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

  const formatMacro = (value: number | null) => {
    if (!value) return "0";
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#10B981";
      case "completed":
        return "#38BDF8";
      case "archived":
        return "#64748B";
      default:
        return "#64748B";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktív";
      case "completed":
        return "Befejezett";
      case "archived":
        return "Archivált";
      default:
        return status;
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
          <Text style={styles.headerTitle}>
            🍽️ {t("mealPlans:title") || "Étrendjeim"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {plans.length} {t("mealPlans:activePlans") || "aktív étrend"}
          </Text>
        </View>

        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="restaurant-outline" size={32} color="#475569" />
            </View>
            <Text style={styles.emptyTitle}>
              {t("mealPlans:noActive") || "Nincs aktív étrend"}
            </Text>
            <Text style={styles.emptyText}>
              {t("mealPlans:noActiveDesc") ||
                "Az edződ még nem osztott meg veled étrendet."}
            </Text>
          </View>
        ) : (
          plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={styles.planCard}
              onPress={() => router.push(`/(app)/meal-plans/${plan.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName} numberOfLines={1}>
                  {plan.name}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(plan.status) + "15" },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(plan.status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(plan.status) },
                    ]}
                  >
                    {getStatusLabel(plan.status)}
                  </Text>
                </View>
              </View>

              {plan.description && (
                <Text style={styles.planDescription} numberOfLines={2}>
                  {plan.description}
                </Text>
              )}

              <View style={styles.planMacros}>
                {plan.daily_calories && (
                  <View style={styles.macroItem}>
                    <Ionicons name="flame-outline" size={16} color="#F59E0B" />
                    <Text style={styles.macroValue}>
                      {plan.daily_calories} kcal
                    </Text>
                  </View>
                )}
                {plan.daily_protein && (
                  <View style={styles.macroItem}>
                    <Ionicons
                      name="barbell-outline"
                      size={16}
                      color="#38BDF8"
                    />
                    <Text style={styles.macroValue}>
                      {formatMacro(plan.daily_protein)}g{" "}
                      {t("mealPlans:protein") || "fehérje"}
                    </Text>
                  </View>
                )}
                {plan.daily_carbs && (
                  <View style={styles.macroItem}>
                    <Ionicons
                      name="nutrition-outline"
                      size={16}
                      color="#10B981"
                    />
                    <Text style={styles.macroValue}>
                      {formatMacro(plan.daily_carbs)}g{" "}
                      {t("mealPlans:carbs") || "szénhidrát"}
                    </Text>
                  </View>
                )}
                {plan.daily_fat && (
                  <View style={styles.macroItem}>
                    <Ionicons name="water-outline" size={16} color="#8B5CF6" />
                    <Text style={styles.macroValue}>
                      {formatMacro(plan.daily_fat)}g{" "}
                      {t("mealPlans:fat") || "zsír"}
                    </Text>
                  </View>
                )}
              </View>

              {plan.shopping_list && (
                <View style={styles.shoppingPreview}>
                  <Ionicons name="cart-outline" size={14} color="#475569" />
                  <Text style={styles.shoppingPreviewText} numberOfLines={1}>
                    {plan.shopping_list}
                  </Text>
                </View>
              )}

              <View style={styles.planFooter}>
                <Text style={styles.planDate}>
                  {new Date(plan.created_at).toLocaleDateString("hu-HU", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#475569" />
              </View>
            </TouchableOpacity>
          ))
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  planDescription: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 18,
  },
  planMacros: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1C2638",
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  macroValue: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  shoppingPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(71, 85, 105, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  shoppingPreviewText: {
    fontSize: 11,
    color: "#475569",
    flex: 1,
  },
  planFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planDate: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
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
