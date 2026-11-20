import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { supabase } from "../../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../../services/i18n";

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

interface SetData {
  id: number;
  reps: string;
  weight: string;
  completed: boolean;
}

export default function WorkoutLogScreen() {
  const { id, day }=useLocalSearchParams<{ id: string; day: string }>();
  const [exercises, setExercises]=useState<Exercise[]>([]);
  const [loading, setLoading]=useState(true);
  const [saving, setSaving]=useState(false);
  const [feeling, setFeeling]=useState<number|null>(null);
  const [notes, setNotes]=useState("");
  const [setsData, setSetsData]=useState<Record<string, SetData[]>>({});
  const [planName, setPlanName]=useState("");
  const [, setCurrentLang]=useState(getCurrentLanguage());

  const fetchExercises=React.useCallback(async function() {
    return Promise.resolve(supabase.auth.getUser()).then(async (loaded) => {
      const {
        data: { user },
      }=loaded;

      if (!user) {
        setLoading(false);
        return;
      }

      // Edzésterv neve
      const { data: planData }=await supabase
        .from("workout_plans")
        .select("name")
        .eq("id", id)
        .single();

      if (planData) setPlanName(planData.name);

      // Gyakorlatok
      const { data, error }=await supabase
        .from("exercises")
        .select("*")
        .eq("workout_plan_id", id)
        .eq("day_of_week", parseInt(day||"1"))
        .order("order_index", { ascending: true });

      if (!error&&data) {
        setExercises(data);
        // Initialize sets data
        const initialSets: Record<string, SetData[]>={};
        data.forEach((ex) => {
          initialSets[ex.id]=Array.from({ length: ex.sets||3 }, (_, i) => ({
            id: i,
            reps: ex.min_reps?.toString()||"8",
            weight: ex.weight?.toString()||"",
            completed: false,
          }));
        });
        setSetsData(initialSets);
      }
      setLoading(false);

    });
  }, [id, day]);

  const updateSet=(
    exerciseId: string,
    setId: number,
    field: "reps"|"weight",
    value: string,
  ) => {
    setSetsData((prev) => {
      const exerciseSets=prev[exerciseId]||[];
      const updatedSets=exerciseSets.map((set) =>
        set.id===setId? { ...set, [field]: value }:set,
      );
      return { ...prev, [exerciseId]: updatedSets };
    });
  };

  const toggleSetComplete=(exerciseId: string, setId: number) => {
    setSetsData((prev) => {
      const exerciseSets=prev[exerciseId]||[];
      const updatedSets=exerciseSets.map((set) =>
        set.id===setId? { ...set, completed: !set.completed }:set,
      );
      return { ...prev, [exerciseId]: updatedSets };
    });
  };

  const allSetsCompleted=() => {
    for (const exerciseId in setsData) {
      const sets=setsData[exerciseId];
      if (!sets.every((set) => set.completed&&set.reps)) {
        return false;
      }
    }
    return true;
  };

  const handleSave=async () => {
    if (!allSetsCompleted()) {
      Alert.alert(
        t("common:warning")||"Figyelem",
        t("errors:fillAllSets")||"Minden sorozatot pipálj ki!",
      );
      return;
    }

    if (!feeling) {
      Alert.alert(
        t("common:warning")||"Figyelem",
        "Kérlek, add meg hogyan érezted magad!",
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      }=await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Hiba", "Nincs bejelentkezve!");
        setSaving(false);
        return;
      }

      const today=new Date().toISOString().split("T")[0];

      // 1. Workout log létrehozása
      const { data: workoutLog, error: logError }=await supabase
        .from("workout_logs")
        .insert({
          client_id: user.id,
          workout_plan_id: id,
          performed_at: today,
          feeling: feeling,
          notes: notes||null,
        })
        .select()
        .single();

      if (logError) throw logError;

      // 2. Workout log exercises
      const exerciseLogs: any[]=[];
      for (const exercise of exercises) {
        const sets=setsData[exercise.id]||[];
        const repsCompleted=sets.map((s) => s.reps).join(",");
        const weightsUsed=sets
          .map((s) => s.weight)
          .filter((w) => w)
          .join(",");

        const isCardio=exercise.category==="cardio";

        exerciseLogs.push({
          workout_log_id: workoutLog.id,
          exercise_name: exercise.name,
          sets_completed: isCardio? null:sets.length,
          reps_completed: isCardio? null:repsCompleted,
          weight_used: isCardio? null:weightsUsed||null,
          duration_completed: isCardio? parseInt(weightsUsed)||null:null,
          notes: exercise.notes||null,
        });
      }

      const { error: exError }=await supabase
        .from("workout_log_exercises")
        .insert(exerciseLogs);

      if (exError) throw exError;

      Alert.alert(
        t("common:success")||"Siker!",
        t("workout:successSave")||"Edzés sikeresen rögzítve!",
      );
      router.back();
    } catch (error: any) {
      Alert.alert("Hiba", error.message||"Nem sikerült menteni");
    } finally {
      setSaving(false);
    }
  };


  useEffect(() => {
    fetchExercises();
    const unsubscribe=subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });
    return () => unsubscribe();
  }, [id, day, fetchExercises]);

  const feelingOptions=[
    { value: 10, emoji: "😊", label: t("workout:excellent")||"Kiváló" },
    { value: 9, emoji: "😄", label: "Nagyon jó" },
    { value: 8, emoji: "🙂", label: "Jó" },
    { value: 7, emoji: "😐", label: t("workout:average")||"Átlagos" },
    { value: 6, emoji: "😕", label: "Gyenge" },
    { value: 5, emoji: "😫", label: t("workout:hard")||"Nehéz volt" },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  if (exercises.length===0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Stack.Screen
          options={{
            title: "Edzés naplózás",
            headerTitleStyle: { color: "#F8FAFC", fontWeight: "600" },
            headerStyle: { backgroundColor: "#090D16" },
            headerTintColor: "#38BDF8",
            headerBackTitle: t("common:back"),
          }}
        />
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color="#1C2638" />
          <Text style={styles.emptyStateText}>
            Ezen a napon nincs gyakorlat
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen
        options={{
          title: planName||"Edzés naplózás",
          headerTitleStyle: { color: "#F8FAFC", fontWeight: "600" },
          headerStyle: { backgroundColor: "#090D16" },
          headerTintColor: "#38BDF8",
          headerBackTitle: t("common:back"),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {exercises.map((exercise) => {
          const sets=setsData[exercise.id]||[];
          const allCompleted=sets.every((s) => s.completed);

          return (
            <View key={exercise.id} style={styles.exerciseSection}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                {allCompleted&&(
                  <View style={styles.completedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                    />
                  </View>
                )}
              </View>

              <View style={styles.setsContainer}>
                <View style={styles.setsHeader}>
                  <Text style={[styles.headerCell, styles.setsCell]}>
                    {t("workout:sets")||"Szet"}
                  </Text>
                  <Text style={[styles.headerCell, styles.repsCell]}>
                    {t("workout:reps")||"Ism"}
                  </Text>
                  <Text style={[styles.headerCell, styles.weightCell]}>
                    {t("workout:weight")||"Súly"} (kg)
                  </Text>
                  <Text style={[styles.headerCell, styles.checkCell]}></Text>
                </View>

                {sets.map((set) => (
                  <View
                    key={set.id}
                    style={[
                      styles.setRow,
                      set.completed&&styles.completedRow,
                    ]}
                  >
                    <View style={[styles.rowCell, styles.setsCell]}>
                      <Text style={styles.setNumber}>{set.id+1}.</Text>
                    </View>
                    <View style={[styles.rowCell, styles.repsCell]}>
                      <TextInput
                        style={[
                          styles.input,
                          set.completed&&styles.completedInput,
                        ]}
                        value={set.reps}
                        onChangeText={(text) =>
                          updateSet(exercise.id, set.id, "reps", text)
                        }
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#475569"
                        editable={!set.completed}
                      />
                    </View>
                    <View style={[styles.rowCell, styles.weightCell]}>
                      <TextInput
                        style={[
                          styles.input,
                          set.completed&&styles.completedInput,
                        ]}
                        value={set.weight}
                        onChangeText={(text) =>
                          updateSet(exercise.id, set.id, "weight", text)
                        }
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#475569"
                        editable={!set.completed}
                      />
                    </View>
                    <View style={[styles.rowCell, styles.checkCell]}>
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          set.completed&&styles.checkButtonActive,
                        ]}
                        onPress={() => toggleSetComplete(exercise.id, set.id)}
                      >
                        {set.completed? (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                          />
                        ):(
                          <Ionicons
                            name="square-outline"
                            size={16}
                            color="#475569"
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* Hangulat */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("workout:feeling")||"Hogyan érezted magad?"}
          </Text>
          <View style={styles.feelingContainer}>
            {feelingOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.feelingButton,
                  feeling===option.value&&styles.feelingButtonActive,
                ]}
                onPress={() => setFeeling(option.value)}
              >
                <Text style={styles.feelingEmoji}>{option.emoji}</Text>
                <Text style={styles.feelingLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Megjegyzés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("common:notes")||"Megjegyzés"}
          </Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={
              t("workout:feedbackPlaceholder")||
              "Megjegyzések, észrevételek..."
            }
            placeholderTextColor="#475569"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Mentés gomb */}
        <TouchableOpacity
          style={[styles.saveButton, saving&&styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving
              ? t("workout:saving")||"Mentés..."
              :t("workout:finishWorkout")||"Edzés befejezése"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyStateText: {
    color: "#475569",
    fontSize: 16,
    marginTop: 12,
  },
  exerciseSection: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  completedBadge: {
    padding: 4,
  },
  setsContainer: {
    backgroundColor: "#090D16",
    borderRadius: 12,
    padding: 8,
  },
  setsHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1C2638",
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1C2638",
  },
  completedRow: {
    backgroundColor: "rgba(56, 189, 248, 0.05)",
    borderRadius: 8,
  },
  rowCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  setsCell: {
    width: "15%",
  },
  repsCell: {
    width: "35%",
  },
  weightCell: {
    width: "35%",
  },
  checkCell: {
    width: "15%",
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  input: {
    backgroundColor: "#131C2E",
    borderWidth: 1,
    borderColor: "#1C2638",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: "#F8FAFC",
    textAlign: "center",
    width: "90%",
  },
  completedInput: {
    opacity: 0.5,
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#131C2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  checkButtonActive: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 12,
  },
  feelingContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  feelingButton: {
    flex: 1,
    minWidth: "30%",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#131C2E",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  feelingButtonActive: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderColor: "#38BDF8",
  },
  feelingEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  feelingLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  notesInput: {
    backgroundColor: "#131C2E",
    borderWidth: 1,
    borderColor: "#1C2638",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#F8FAFC",
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#38BDF8",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#090D16",
  },
});
