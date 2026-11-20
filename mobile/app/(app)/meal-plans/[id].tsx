import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { supabase } from "../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../services/i18n";

interface MealEntry {
  id: string;
  day_of_week: number;
  meal_type: string;
  food_name: string;
  quantity: number|null;
  unit: string;
  calories: number|null;
  protein: number|null;
  carbs: number|null;
  fat: number|null;
  notes: string|null;
}

interface MealPlan {
  id: string;
  name: string;
  description: string|null;
  daily_calories: number|null;
  daily_protein: number|null;
  daily_carbs: number|null;
  daily_fat: number|null;
  notes: string|null;
  shopping_list: string|null;
}

const weekDays=[
  { id: 1, label: "Hétfő", short: "H" },
  { id: 2, label: "Kedd", short: "K" },
  { id: 3, label: "Szerda", short: "Sze" },
  { id: 4, label: "Csütörtök", short: "Cs" },
  { id: 5, label: "Péntek", short: "P" },
  { id: 6, label: "Szombat", short: "Szo" },
  { id: 7, label: "Vasárnap", short: "V" },
];

const mealTypes=[
  { id: "breakfast", label: "Reggeli", icon: "sunny-outline" },
  { id: "morning_snack", label: "Tízórai", icon: "cafe-outline" },
  { id: "lunch", label: "Ebéd", icon: "restaurant-outline" },
  { id: "afternoon_snack", label: "Uzsonna", icon: "cafe-outline" },
  { id: "dinner", label: "Vacsora", icon: "moon-outline" },
  { id: "evening_snack", label: "Esti snack", icon: "bed-outline" },
];

export default function MealPlanDetailScreen() {
  const { id }=useLocalSearchParams<{ id: string }>();
  const [plan, setPlan]=useState<MealPlan|null>(null);
  const [entries, setEntries]=useState<MealEntry[]>([]);
  const [loading, setLoading]=useState(true);
  const [selectedDay, setSelectedDay]=useState<number>(() => new Date().getDay()||7);
  const [currentLang, setCurrentLang]=useState(getCurrentLanguage());

  const fetchData=React.useCallback(async () => {
    return Promise.resolve(supabase.auth.getUser()).then(async (loaded) => {
      const {
        data: { user },
      }=loaded;

      if (!user) {
        setLoading(false);
        return;
      }

      const [planRes, entriesRes]=await Promise.all([
        supabase
          .from("meal_plans")
          .select("*")
          .eq("id", id)
          .eq("client_id", user.id)
          .single(),
        supabase
          .from("daily_meal_entries")
          .select("*")
          .eq("meal_plan_id", id)
          .order("day_of_week", { ascending: true })
          .order("order_index", { ascending: true }),
      ]);

      if (planRes.data) setPlan(planRes.data);
      if (entriesRes.data) setEntries(entriesRes.data);
      setLoading(false);

    });
  }, [id]);

  const getDayEntries=(day: number) => {
    return entries.filter((e) => e.day_of_week===day);
  };

  const getMealEntries=(day: number, mealType: string) => {
    return entries.filter(
      (e) => e.day_of_week===day&&e.meal_type===mealType,
    );
  };

  const getMealIcon=(mealType: string): any => {
    const found=mealTypes.find((m) => m.id===mealType);
    return found?.icon||"restaurant-outline";
  };

  const getMealLabel=(mealType: string) => {
    const found=mealTypes.find((m) => m.id===mealType);
    return found?.label||mealType;
  };

  const calculateDayTotals=(day: number) => {
    const dayEntries=getDayEntries(day);
    return {
      calories: dayEntries.reduce((sum, e) => sum+(e.calories||0), 0),
      protein: dayEntries.reduce((sum, e) => sum+(e.protein||0), 0),
      carbs: dayEntries.reduce((sum, e) => sum+(e.carbs||0), 0),
      fat: dayEntries.reduce((sum, e) => sum+(e.fat||0), 0),
    };
  };

  const formatMacro=(value: number|null) => {
    if (!value) return "0";
    return value%1===0? value.toString():value.toFixed(1);
  };


  useEffect(() => {
    fetchData();
    const unsubscribe=subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });
    return () => unsubscribe();
  }, [id, fetchData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Étrend nem található</Text>
      </View>
    );
  }

  const dayEntries=getDayEntries(selectedDay);
  const totals=calculateDayTotals(selectedDay);
  const hasEntries=dayEntries.length>0;

  // Csoportosítás étkezésenként
  const groupedMeals=mealTypes
    .map((meal) => ({
      ...meal,
      entries: getMealEntries(selectedDay, meal.id),
    }))
    .filter((m) => m.entries.length>0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen
        options={{
          title: plan.name,
          headerTitleStyle: { color: "#F8FAFC", fontWeight: "600" },
          headerStyle: { backgroundColor: "#090D16" },
          headerTintColor: "#38BDF8",
          headerBackTitle: t("common:back"),
        }}
      />

      <View style={styles.content}>
        {/* Napok */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daysScroll}
          contentContainerStyle={styles.daysContainer}
        >
          {weekDays.map((day) => {
            const entries=getDayEntries(day.id);
            const hasEntry=entries.length>0;
            const isToday=day.id===selectedDay;

            return (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  isToday&&styles.dayButtonActive,
                  hasEntry&&styles.dayButtonHasEntry,
                ]}
                onPress={() => setSelectedDay(day.id)}
              >
                <Text
                  style={[
                    styles.dayShort,
                    isToday&&styles.dayShortActive,
                    hasEntry&&styles.dayShortHasEntry,
                  ]}
                >
                  {day.short}
                </Text>
                {hasEntry&&(
                  <View style={styles.dayDot}>
                    <Text style={styles.dayDotText}>{entries.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Makrók összegzés */}
        <View style={styles.macroSummary}>
          <View style={styles.macroItem}>
            <Ionicons name="flame-outline" size={16} color="#F59E0B" />
            <Text style={styles.macroValue}>{totals.calories} kcal</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Ionicons name="barbell-outline" size={16} color="#38BDF8" />
            <Text style={styles.macroValue}>
              {formatMacro(totals.protein)}g P
            </Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Ionicons name="nutrition-outline" size={16} color="#10B981" />
            <Text style={styles.macroValue}>
              {formatMacro(totals.carbs)}g Sz
            </Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Ionicons name="water-outline" size={16} color="#8B5CF6" />
            <Text style={styles.macroValue}>{formatMacro(totals.fat)}g Zs</Text>
          </View>
        </View>

        {/* Ételek listája */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.entriesContainer}
        >
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>
              {weekDays.find((d) => d.id===selectedDay)?.label}
            </Text>
            {plan.daily_calories&&(
              <Text style={styles.dayCalories}>
                {totals.calories} / {plan.daily_calories} kcal
              </Text>
            )}
          </View>

          {!hasEntries? (
            <View style={styles.emptyEntries}>
              <Ionicons name="restaurant-outline" size={40} color="#1C2638" />
              <Text style={styles.emptyEntriesText}>
                Ezen a napon nincs étkezés
              </Text>
            </View>
          ):(
            groupedMeals.map((meal) => (
              <View key={meal.id} style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <Ionicons
                    name={getMealIcon(meal.id)}
                    size={16}
                    color="#64748B"
                  />
                  <Text style={styles.mealTitle}>{meal.label}</Text>
                </View>

                {meal.entries.map((entry, index) => (
                  <View key={entry.id} style={styles.foodItem}>
                    <View style={styles.foodRow}>
                      <View style={styles.foodNumber}>
                        <Text style={styles.foodNumberText}>{index+1}</Text>
                      </View>
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>{entry.food_name}</Text>
                        <Text style={styles.foodQuantity}>
                          {entry.quantity} {entry.unit}
                        </Text>
                      </View>
                      <View style={styles.foodCalories}>
                        <Text style={styles.foodCaloriesText}>
                          {entry.calories||0} kcal
                        </Text>
                      </View>
                    </View>

                    <View style={styles.foodMacros}>
                      {entry.protein&&(
                        <Text style={styles.foodMacroText}>
                          💪 {formatMacro(entry.protein)}g
                        </Text>
                      )}
                      {entry.carbs&&(
                        <Text style={styles.foodMacroText}>
                          🍚 {formatMacro(entry.carbs)}g
                        </Text>
                      )}
                      {entry.fat&&(
                        <Text style={styles.foodMacroText}>
                          🥑 {formatMacro(entry.fat)}g
                        </Text>
                      )}
                    </View>

                    {entry.notes&&(
                      <Text style={styles.foodNotes} numberOfLines={2}>
                        📝 {entry.notes}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))
          )}

          {/* Bevásárlólista gomb */}
          {plan.shopping_list&&(
            <TouchableOpacity
              style={styles.shoppingButton}
              onPress={() =>
                router.push(`/(app)/meal-plans/${id}/shopping-list`)
              }
            >
              <Ionicons name="cart-outline" size={20} color="#090D16" />
              <Text style={styles.shoppingButtonText}>
                Bevásárlólista megtekintése
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#090D16" />
            </TouchableOpacity>
          )}

          {plan.notes&&(
            <View style={styles.notesContainer}>
              <Ionicons name="chatbubble-outline" size={16} color="#475569" />
              <Text style={styles.notesText}>{plan.notes}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
    paddingHorizontal: 24,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "500",
  },
  daysScroll: {
    flexGrow: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C2638",
  },
  daysContainer: {
    gap: 8,
  },
  dayButton: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#131C2E",
    borderWidth: 1,
    borderColor: "#1C2638",
    minWidth: 48,
    position: "relative",
  },
  dayButtonActive: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  dayButtonHasEntry: {
    borderColor: "#38BDF8",
  },
  dayShort: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  dayShortActive: {
    color: "#090D16",
  },
  dayShortHasEntry: {
    color: "#F8FAFC",
  },
  dayDot: {
    marginTop: 2,
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: "center",
  },
  dayDotText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#090D16",
  },
  macroSummary: {
    flexDirection: "row",
    backgroundColor: "#131C2E",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1C2638",
    justifyContent: "space-around",
    alignItems: "center",
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  macroValue: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  macroDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#1C2638",
  },
  entriesContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  dayCalories: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyEntries: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyEntriesText: {
    color: "#475569",
    fontSize: 14,
    marginTop: 12,
  },
  mealSection: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  foodItem: {
    backgroundColor: "#131C2E",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  foodNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  foodNumberText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#38BDF8",
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  foodQuantity: {
    fontSize: 11,
    color: "#64748B",
  },
  foodCalories: {
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  foodCaloriesText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#38BDF8",
  },
  foodMacros: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#1C2638",
  },
  foodMacroText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "500",
  },
  foodNotes: {
    fontSize: 11,
    color: "#475569",
    fontStyle: "italic",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#1C2638",
  },
  shoppingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#38BDF8",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  shoppingButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#090D16",
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(71, 85, 105, 0.08)",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  notesText: {
    fontSize: 13,
    color: "#94A3B8",
    flex: 1,
    lineHeight: 18,
  },
});
