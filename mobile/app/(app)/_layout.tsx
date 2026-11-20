// app/(app)/_layout.tsx
import { Stack } from "expo-router";
import { TouchableOpacity, Alert, StyleSheet } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  t,
  subscribeToLanguageChange,
  getCurrentLanguage,
} from "../../services/i18n";

const LogoutButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      marginRight: 8,
      padding: 6,
      borderRadius: 20,
    }}
  >
    <Ionicons name="log-out-outline" size={24} color="#EF4444" />
  </TouchableOpacity>
);

export default function AppLayout() {
  const [isChecking, setIsChecking] = useState(true);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  useEffect(() => {
    const unsubscribe = subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    Alert.alert(t("common:logout"), t("common:logoutConfirm"), [
      { text: t("common:cancel"), style: "cancel" },
      {
        text: t("common:logout"),
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Hiba a kijelentkezés során:", error);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/(auth)/login");
      }
      setIsChecking(false);
    };
    checkSession();
  }, []);

  if (isChecking) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#090D16" },
        headerTitleStyle: {
          fontWeight: "700",
          color: "#F8FAFC",
          fontSize: 17,
        },
        headerShadowVisible: false,
        headerTintColor: "#38BDF8",
        headerTitleAlign: "center",
        headerRight: () => <LogoutButton onPress={handleLogout} />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t("navigation:dashboard"), headerLeft: () => null }}
      />
      <Stack.Screen
        name="workout-plans"
        options={{ title: t("navigation:workoutPlans") }}
      />
      <Stack.Screen
        name="workout-plans/[id]"
        options={{ title: t("workout:title") }}
      />
      <Stack.Screen
        name="workout-plans/[id]/log"
        options={{ title: "Edzés naplózás" }}
      />
      <Stack.Screen
        name="progress"
        options={{ title: t("navigation:progress") }}
      />
      <Stack.Screen
        name="measurements/index"
        options={{ title: t("navigation:measurements") }}
      />
      <Stack.Screen
        name="measurements/add"
        options={{ title: t("measurements:addMeasurement") }}
      />
      <Stack.Screen
        name="profile"
        options={{ title: t("navigation:profile") }}
      />
      <Stack.Screen
        name="files/index"
        options={{ title: t("navigation:files") }}
      />
      <Stack.Screen name="files/upload" options={{ title: "Fájl feltöltés" }} />
      <Stack.Screen
        name="chat/index"
        options={{
          title: t("navigation:chat"),
          headerBackTitle: t("common:back"),
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{ title: t("chat:coach"), headerBackTitle: t("common:back") }}
      />
      <Stack.Screen
        name="meal-plans/index"
        options={{ title: t("navigation:mealPlans") }}
      />
      <Stack.Screen
        name="meal-plans/[id]"
        options={{ title: "Étrend részletek" }}
      />
      <Stack.Screen
        name="meal-plans/[id]/shopping-list"
        options={{ title: "Bevásárlólista" }}
      />
      <Stack.Screen
        name="schedule"
        options={{ title: t("navigation:schedule") }}
      />
      <Stack.Screen
        name="notifications/index"
        options={{ title: "🔔 Értesítések" }}
      />
    </Stack>
  );
}
