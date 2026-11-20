import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../services/i18n";

export default function AddMeasurementScreen() {
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  const [formData, setFormData] = useState({
    measured_at: new Date().toISOString().split("T")[0],
    weight: "",
    body_fat: "",
    muscle_mass: "",
    chest: "",
    waist: "",
    hips: "",
    arm_left: "",
    arm_right: "",
    thigh_left: "",
    thigh_right: "",
    notes: "",
  });

  React.useEffect(() => {
    const unsubscribe = subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const checkExistingMeasurement = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("measurements")
      .select("id, measured_at")
      .eq("client_id", user.id)
      .eq("measured_at", formData.measured_at)
      .maybeSingle();

    return { exists: !!data, measurement: data };
  };

  const handleSubmit = async () => {
    if (!formData.weight && !formData.body_fat && !formData.chest) {
      Alert.alert(t("common:warning"), t("measurements:atLeastOne"));
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(t("errors:generic"), t("errors:unauthorized"));
        return;
      }

      const existing = await checkExistingMeasurement();
      const exists = existing && existing.exists;

      if (exists) {
        Alert.alert(
          t("measurements:existingTitle"),
          t("measurements:existingMessage").replace(
            "{{date}}",
            formData.measured_at,
          ),
          [{ text: t("common:ok"), onPress: () => router.back() }],
        );
        setLoading(false);
        return;
      }

      const measurementData = {
        client_id: user.id,
        measured_at: formData.measured_at,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        body_fat: formData.body_fat ? parseFloat(formData.body_fat) : null,
        muscle_mass: formData.muscle_mass
          ? parseFloat(formData.muscle_mass)
          : null,
        chest: formData.chest ? parseFloat(formData.chest) : null,
        waist: formData.waist ? parseFloat(formData.waist) : null,
        hips: formData.hips ? parseFloat(formData.hips) : null,
        arm_left: formData.arm_left ? parseFloat(formData.arm_left) : null,
        arm_right: formData.arm_right ? parseFloat(formData.arm_right) : null,
        thigh_left: formData.thigh_left
          ? parseFloat(formData.thigh_left)
          : null,
        thigh_right: formData.thigh_right
          ? parseFloat(formData.thigh_right)
          : null,
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from("measurements")
        .insert([measurementData]);

      if (error) {
        if (error.code === "23505") {
          Alert.alert(
            t("measurements:existingTitle"),
            t("measurements:existingMessage").replace(
              "{{date}}",
              formData.measured_at,
            ),
            [{ text: t("common:ok"), onPress: () => router.back() }],
          );
        } else {
          throw error;
        }
        return;
      }

      Alert.alert(t("common:success"), t("measurements:saveSuccess"));
      router.back();
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert(t("errors:generic"), error.message || t("errors:generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Dátum */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 {t("measurements:date")}</Text>
            <TextInput
              style={styles.input}
              value={formData.measured_at}
              onChangeText={(text) => handleChange("measured_at", text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748B"
            />
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="#64748B"
              />
              <Text style={styles.infoText}>{t("measurements:onePerDay")}</Text>
            </View>
          </View>

          {/* Testösszetétel */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ⚖️ {t("measurements:bodyComposition")}
            </Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>
                  {t("measurements:weight")} ({t("common:kg")})
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.weight}
                  onChangeText={(text) => handleChange("weight", text)}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>
                  {t("measurements:bodyFat")} (%)
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.body_fat}
                  onChangeText={(text) => handleChange("body_fat", text)}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>
                  {t("measurements:muscleMass")} ({t("common:kg")})
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.muscle_mass}
                  onChangeText={(text) => handleChange("muscle_mass", text)}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>
          </View>

          {/* Körfogatok */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📏 {t("measurements:circumference")}
            </Text>
            <View style={styles.row}>
              <View style={styles.thirdInput}>
                <Text style={styles.inputLabel}>
                  {t("measurements:chest")} (cm)
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.chest}
                  onChangeText={(text) => handleChange("chest", text)}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={styles.thirdInput}>
                <Text style={styles.inputLabel}>
                  {t("measurements:waist")} (cm)
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.waist}
                  onChangeText={(text) => handleChange("waist", text)}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={styles.thirdInput}>
                <Text style={styles.inputLabel}>
                  {t("measurements:hips")} (cm)
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.hips}
                  onChangeText={(text) => handleChange("hips", text)}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <Text style={styles.subsectionTitle}>{t("measurements:arms")}</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>
                  {t("measurements:armLeft")} (cm)
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.arm_left}
                  onChangeText={(text) => handleChange("arm_left", text)}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>
                  {t("measurements:armRight")} (cm)
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.arm_right}
                  onChangeText={(text) => handleChange("arm_right", text)}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <Text style={styles.subsectionTitle}>
              {t("measurements:thighs")}
            </Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>
                  {t("measurements:thighLeft")} (cm)
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.thigh_left}
                  onChangeText={(text) => handleChange("thigh_left", text)}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>
                  {t("measurements:thighRight")} (cm)
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.thigh_right}
                  onChangeText={(text) => handleChange("thigh_right", text)}
                  keyboardType="numeric"
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>
          </View>

          {/* Megjegyzés */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 {t("common:notes")}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => handleChange("notes", text)}
              placeholder={t("measurements:notesPlaceholder")}
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Gombok */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>{t("common:cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? t("common:loading") : t("measurements:save")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  keyboardView: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 12,
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  thirdInput: { flex: 1 },
  inputLabel: { fontSize: 12, color: "#94A3B8", marginBottom: 4 },
  input: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#F8FAFC",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: "#1E293B",
    borderRadius: 8,
  },
  infoText: { fontSize: 11, color: "#64748B", flex: 1 },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  cancelButtonText: { color: "#94A3B8", fontSize: 16, fontWeight: "600" },
  saveButton: {
    flex: 2,
    backgroundColor: "#38BDF8",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: { color: "#090D16", fontSize: 16, fontWeight: "600" },
  disabledButton: { opacity: 0.5 },
});
