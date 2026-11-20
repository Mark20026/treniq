import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "../services/supabase";
import "../services/i18n";
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
  setupNotificationChannels,
} from "../services/notificationService";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const initialCheckDone = useRef(false);

  const handleNotificationResponse = (
    response: Notifications.NotificationResponse,
  ) => {
    const data = response.notification.request.content.data;

    // 🔥 Navigáció az értesítés típusa alapján
    switch (data?.type) {
      case "appointment":
        router.push("/(app)/schedule");
        break;
      case "message":
        if (data?.clientId) {
          router.push(`/(app)/chat/${data.clientId}`);
        }
        break;
      case "workout_reminder":
        router.push("/(app)/workout-plans");
        break;
      case "measurement_reminder":
        router.push("/(app)/measurements");
        break;
      default:
        router.push("/(app)");
        break;
    }
  };

  useEffect(() => {
    // 🔥 Notification csatornák beállítása
    setupNotificationChannels();

    // 🔥 Push token regisztráció
    const registerPushToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await registerForPushNotificationsAsync();
      }
    };

    registerPushToken();

    // 🔥 Notification listener-ek beállítása
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {

      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse,
      );

    // 🔥 Auth változás figyelése - token újraregisztráció
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          await registerForPushNotificationsAsync();
        }
      },
    );

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#38BDF8",
      });
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}
