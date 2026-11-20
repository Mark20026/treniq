import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  changeLanguage,
  getStoredLanguage,
  type Language,
} from "../../services/i18n";

const languages = [
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>("hu");
  const [, forceUpdate] = useState({});

  useEffect(() => {
    getStoredLanguage().then((lang) => {
      setCurrentLanguage(lang);
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Hiba", t("login:emptyFields"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Hiba", t("login:invalidCredentials"));
      } else {
        router.replace("/(app)");
      }
    } catch (err) {
      Alert.alert("Hiba", "Hálózati hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  const selectLanguage = async (langCode: Language) => {
    await changeLanguage(langCode);
    setCurrentLanguage(langCode);
    setShowLanguageModal(false);
    forceUpdate({});
  };

  const currentLanguageFlag =
    languages.find((l) => l.code === currentLanguage)?.flag || "🇭🇺";
  const currentLanguageLabel =
    languages.find((l) => l.code === currentLanguage)?.label || "Magyar";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setShowLanguageModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.languageFlag}>{currentLanguageFlag}</Text>
        <Text style={styles.languageButtonText}>{currentLanguageLabel}</Text>
        <Ionicons name="chevron-down" size={14} color="#94A3B8" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoSquare}>
              <Text style={styles.logoLetter}>T</Text>
            </View>
            <Text style={styles.title}>TRENIQ</Text>
            <Text style={styles.subtitle}>ELITE PERFORMANCE</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>{t("login:email")}</Text>
              <TextInput
                style={styles.input}
                placeholder="pelda@email.com"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>{t("login:password")}</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>{t("login:forgotPassword")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.buttonText}>{t("login:loginButton")}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("login:noAccount")} </Text>
            <Text style={styles.linkText}>{t("login:contactCoach")}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nyelv kiválasztása</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && styles.languageOptionActive,
                ]}
                onPress={() => selectLanguage(lang.code as Language)}
              >
                <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageOptionLabel,
                    currentLanguage === lang.code &&
                      styles.languageOptionLabelActive,
                  ]}
                >
                  {lang.label}
                </Text>
                {currentLanguage === lang.code && (
                  <Ionicons name="checkmark" size={18} color="#38BDF8" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 50 },
  logoSquare: {
    width: 60,
    height: 60,
    backgroundColor: "#38BDF8",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    transform: [{ rotate: "10deg" }],
  },
  logoLetter: { fontSize: 32, fontWeight: "900", color: "#0F172A" },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "#F8FAFC",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "#38BDF8",
    fontWeight: "700",
    letterSpacing: 4,
    marginTop: 5,
  },
  form: { width: "100%" },
  inputWrapper: { marginBottom: 20 },
  label: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#334155",
  },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 30 },
  forgotText: { color: "#38BDF8", fontSize: 14, fontWeight: "500" },
  button: {
    backgroundColor: "#38BDF8",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
    flexWrap: "wrap",
  },
  footerText: { color: "#64748B", fontSize: 15 },
  linkText: { color: "#94A3B8", fontSize: 15, fontWeight: "500" },
  languageButton: {
    position: "absolute",
    top: 60,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E293B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    zIndex: 10,
  },
  languageFlag: { fontSize: 16 },
  languageButtonText: { fontSize: 13, color: "#F8FAFC", fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    borderWidth: 1,
    borderColor: "#334155",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: "600", color: "#F8FAFC" },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  languageOptionActive: { backgroundColor: "rgba(56, 189, 248, 0.1)" },
  languageOptionFlag: { fontSize: 24 },
  languageOptionLabel: {
    flex: 1,
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "500",
  },
  languageOptionLabelActive: { color: "#38BDF8", fontWeight: "600" },
});
