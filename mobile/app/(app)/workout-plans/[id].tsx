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
import {
  useLocalSearchParams,
  Stack,
  router,
  useFocusEffect,
} from "expo-router";
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
  weight: number|null;
  day_of_week: number;
  rest_time: number;
  notes: string|null;
}

interface WorkoutPlan {
  id: string;
  name: string;
  description: string|null;
  difficulty: string;
  weekly_frequency: number;
  exercises: Exercise[];
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

export default function WorkoutPlanDetailScreen() {
  const { id }=useLocalSearchParams<{ id: string }>();
  const [plan, setPlan]=useState<WorkoutPlan|null>(null);
  const [loading, setLoading]=useState(true);
  const [selectedDay, setSelectedDay]=useState<number>(() => new Date().getDay()||7);
  const [, setCurrentLang]=useState(getCurrentLanguage());

  // 🔥 MÓDOSÍTVA: Azokat a napokat tároljuk, amelyeknek a GYAKORLATAI teljesítve lettek
  const [completedDays, setCompletedDays]=useState<Set<number>>(new Set());

  const fetchPlan=React.useCallback(async function() {
    return Promise.resolve(supabase.auth.getUser()).then(async (loaded) => {
      const {
        data: { user },
      }=loaded;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error }=await supabase
        .from("workout_plans")
        .select(
          `
        *,
        exercises (*)
      `,
        )
        .eq("id", id)
        .eq("client_id", user.id)
        .single();

      if (!error&&data) {
        setPlan(data);
      }
      setLoading(false);

    });
  }, [id]);

  const checkCompletedWorkouts=React.useCallback(async function() {
    if (!plan) return;


    return Promise.resolve(supabase.auth.getUser()).then(async (loaded) => {
      const {
        data: { user },
      }=loaded;

      if (!user) return;


      // 1. Lekérjük az összes edzésnaplót ehhez a tervhez
      const { data: logs, error }=await supabase
        .from("workout_logs")
        .select(
          `
          id,
          performed_at,
          workout_log_exercises (
            exercise_name
          )
        `,
        )

        .eq("client_id", user.id)
        .eq("workout_plan_id", id);

      if (error) throw error;

      if (!logs||logs.length===0) {
        setCompletedDays(new Set());
        return;
      }

      // 2. Összegyűjtjük, mely gyakorlatok lettek teljesítve
      const completedExerciseNames=new Set<string>();
      logs.forEach((log: any) => {
        log.workout_log_exercises?.forEach((ex: any) => {
          if (ex.exercise_name) {
            completedExerciseNames.add(ex.exercise_name);
          }
        });
      });


      // 3. Megnézzük, mely napokhoz tartoznak ezek a gyakorlatok
      const completed=new Set<number>();
      plan.exercises?.forEach((exercise) => {
        if (completedExerciseNames.has(exercise.name)) {
          completed.add(exercise.day_of_week);
        }
      });

      setCompletedDays(completed);

    }).catch(async (error) => {
      console.error("Hiba:", error);
    });
  }, [plan, id]);

  // 🔥 MÓDOSÍTVA: A GYAKORLATOK napját pipáljuk ki, nem a teljesítés napját!


  const getDayExercises=(day: number) => {
    return plan?.exercises?.filter((ex) => ex.day_of_week===day)||[];
  };

  const isDayCompleted=(dayId: number): boolean => {
    return completedDays.has(dayId);
  };

  const getCategoryIcon=(category: string): any => {
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

  const getCategoryColor=(category: string) => {
    switch (category) {
      case "chest":
        return "#EF4444";
      case "back":
        return "#3B82F6";
      case "legs":
        return "#10B981";
      case "shoulders":
        return "#8B5CF6";
      case "arms":
        return "#F59E0B";
      case "cardio":
        return "#EC4899";
      case "core":
        return "#14B8A6";
      default:
        return "#64748B";
    }
  };

  const getCategoryLabel=(category: string) => {
    switch (category) {
      case "chest":
        return "Mellkas";
      case "back":
        return "Hát";
      case "legs":
        return "Láb";
      case "shoulders":
        return "Váll";
      case "arms":
        return "Kar";
      case "cardio":
        return "Kardió";
      case "core":
        return "Törzs";
      default:
        return category;
    }
  };

  const startWorkout=() => {
    router.push(`/(app)/workout-plans/${id}/log?day=${selectedDay}`);
  };


  useEffect(() => {
    fetchPlan();
    const unsubscribe=subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });
    return () => unsubscribe();
  }, [id, fetchPlan]);

  useEffect(() => {
    if (plan) {
      checkCompletedWorkouts();
    }
  }, [plan, checkCompletedWorkouts]);


  useFocusEffect(
    React.useCallback(() => {
      if (plan) {
        checkCompletedWorkouts();
      }
    }, [plan, checkCompletedWorkouts]),
  );

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
        <Text style={styles.errorText}>Edzésterv nem található</Text>
      </View>
    );
  }

  const dayExercises=getDayExercises(selectedDay);
  const hasExercises=dayExercises.length>0;
  const isSelectedDayCompleted=isDayCompleted(selectedDay);

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
            const exercises=getDayExercises(day.id);
            const hasExercise=exercises.length>0;
            const isToday=day.id===selectedDay;
            const completed=isDayCompleted(day.id);

            return (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  isToday&&styles.dayButtonActive,
                  hasExercise&&styles.dayButtonHasExercise,
                  completed&&styles.dayButtonCompleted,
                ]}
                onPress={() => setSelectedDay(day.id)}
              >
                <Text
                  style={[
                    styles.dayShort,
                    isToday&&styles.dayShortActive,
                    hasExercise&&styles.dayShortHasExercise,
                    completed&&styles.dayShortCompleted,
                  ]}
                >
                  {day.short}
                </Text>
                {completed? (
                  <View style={styles.completedDot}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                ):hasExercise? (
                  <View style={styles.dayDot}>
                    <Text style={styles.dayDotText}>{exercises.length}</Text>
                  </View>
                ):null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Gyakorlatok */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.exercisesContainer}
        >
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>
              {weekDays.find((d) => d.id===selectedDay)?.label}
            </Text>
            {isSelectedDayCompleted&&(
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.completedBadgeText}>Teljesítve ✅</Text>
              </View>
            )}
          </View>

          {!hasExercises? (
            <View style={styles.emptyExercises}>
              <Ionicons name="barbell-outline" size={40} color="#1C2638" />
              <Text style={styles.emptyExercisesText}>
                Ezen a napon nincs gyakorlat
              </Text>
            </View>
          ):(
            <>
              {dayExercises.map((exercise, index) => {
                // 🔥 Ellenőrizzük, hogy ez a gyakorlat teljesítve van-e
                const isExerciseCompleted=completedDays.has(
                  exercise.day_of_week,
                );

                return (
                  <View key={exercise.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>
                          {String(index+1).padStart(2, "0")}
                        </Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <View style={styles.exerciseTags}>
                          <View
                            style={[
                              styles.categoryTag,
                              {
                                backgroundColor:
                                  getCategoryColor(exercise.category)+"15",
                              },
                            ]}
                          >
                            <Ionicons
                              name={getCategoryIcon(exercise.category)}
                              size={10}
                              color={getCategoryColor(exercise.category)}
                            />
                            <Text
                              style={[
                                styles.categoryTagText,
                                { color: getCategoryColor(exercise.category) },
                              ]}
                            >
                              {getCategoryLabel(exercise.category)}
                            </Text>
                          </View>
                          {isExerciseCompleted&&(
                            <View style={styles.completedTag}>
                              <Ionicons
                                name="checkmark"
                                size={10}
                                color="#10B981"
                              />
                              <Text style={styles.completedTagText}>Kész</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.exerciseDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="repeat-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text style={styles.detailText}>
                          {exercise.sets} × {exercise.min_reps}-
                          {exercise.max_reps} {t("workout:repsShort")}
                        </Text>
                      </View>
                      {exercise.weight&&(
                        <View style={styles.detailItem}>
                          <Ionicons
                            name="barbell-outline"
                            size={14}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>
                            {exercise.weight} {t("common:kg")}
                          </Text>
                        </View>
                      )}
                      {exercise.rest_time&&(
                        <View style={styles.detailItem}>
                          <Ionicons
                            name="timer-outline"
                            size={14}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>
                            {exercise.rest_time} {t("common:seconds")}
                          </Text>
                        </View>
                      )}
                    </View>

                    {exercise.notes&&(
                      <Text style={styles.exerciseNotes} numberOfLines={2}>
                        {exercise.notes}
                      </Text>
                    )}
                  </View>
                );
              })}

              {isSelectedDayCompleted? (
                <View style={styles.completedContainer}>
                  <View style={styles.completedCard}>
                    <Ionicons
                      name="checkmark-circle"
                      size={32}
                      color="#10B981"
                    />
                    <Text style={styles.completedText}>
                      Edzés teljesítve! 💪
                    </Text>
                    <TouchableOpacity
                      style={styles.redoButton}
                      onPress={startWorkout}
                    >
                      <Text style={styles.redoButtonText}>Újra edzés</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ):(
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={startWorkout}
                >
                  <Ionicons
                    name="play-circle-outline"
                    size={20}
                    color="#090D16"
                  />
                  <Text style={styles.startButtonText}>
                    {t("workout:startWorkout")||"Edzés megkezdése"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
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
  dayButtonHasExercise: {
    borderColor: "#38BDF8",
  },
  dayButtonCompleted: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  dayShort: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  dayShortActive: {
    color: "#090D16",
  },
  dayShortHasExercise: {
    color: "#F8FAFC",
  },
  dayShortCompleted: {
    color: "#FFFFFF",
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
  completedDot: {
    marginTop: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  exercisesContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
  emptyExercises: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyExercisesText: {
    color: "#475569",
    fontSize: 14,
    marginTop: 12,
  },
  exerciseCard: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38BDF8",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  exerciseTags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: "700",
  },
  completedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  completedTagText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#10B981",
  },
  exerciseDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1C2638",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  exerciseNotes: {
    fontSize: 12,
    color: "#475569",
    fontStyle: "italic",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1C2638",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#38BDF8",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#090D16",
  },
  completedContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  completedCard: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  redoButton: {
    backgroundColor: "#1C2638",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  redoButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
