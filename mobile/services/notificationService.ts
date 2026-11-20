import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import { router } from "expo-router";


// 🔥 Token mentése a szerveren - JAVÍTVA
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web" || !process.env.EXPO_PUBLIC_EAS_PROJECT_ID) return null;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {

      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // 🔥 Ellenőrizzük, hogy létezik-e már token
      const { data: existingDevice } = await supabase
        .from("client_devices")
        .select("id")
        .eq("client_id", user.id)
        .maybeSingle();

      let error;

      if (existingDevice) {
        // 🔥 Update ha létezik
        const { error: updateError } = await supabase
          .from("client_devices")
          .update({
            expo_push_token: token.data,
            device_name: Platform.OS === "ios" ? "iOS" : "Android",
            updated_at: new Date().toISOString(),
          })
          .eq("client_id", user.id);
        error = updateError;
      } else {
        // 🔥 Insert ha nem létezik
        const { error: insertError } = await supabase
          .from("client_devices")
          .insert({
            client_id: user.id,
            expo_push_token: token.data,
            device_name: Platform.OS === "ios" ? "iOS" : "Android",
          });
        error = insertError;
      }

      if (error) {
        console.error("❌ Token mentési hiba:", error);
      } else {

      }
    }

    return token.data;
  } catch (error) {
    console.error("❌ Push token regisztrációs hiba:", error);
    return null;
  }
}

// 🔥 Értesítések kezelése - alkalmazás előtérben
export function setupNotificationListeners() {
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {

    }
  );

  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;

      handleNotificationNavigation(data);
    }
  );

  return { notificationListener, responseListener };
}

// 🔥 Navigáció kezelése értesítés alapján
function handleNotificationNavigation(data: any) {
  const type = data?.type;
  const appointmentId = data?.appointmentId;
  const clientId = data?.clientId;

  switch (type) {
    case "appointment":
      router.push("/(app)/schedule");
      break;
    case "message":
      if (clientId) {
        router.push(`/(app)/chat/${clientId}`);
      }
      break;
    case "workout_reminder":
      router.push("/(app)/workout-plans");
      break;
    case "measurement_reminder":
      router.push("/(app)/measurements");
      break;
    case "goal_achieved":
      router.push("/(app)/progress");
      break;
    default:
      router.push("/(app)");
      break;
  }
}

// 🔥 Android csatorna beállítása
export async function setupNotificationChannels() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#38BDF8",
    });

    await Notifications.setNotificationChannelAsync("appointment-reminders", {
      name: "Időpont emlékeztetők",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#38BDF8",
    });

    await Notifications.setNotificationChannelAsync("workout-reminders", {
      name: "Edzés emlékeztetők",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#10B981",
    });

    await Notifications.setNotificationChannelAsync("messages", {
      name: "Üzenetek",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#8B5CF6",
    });
  }
}

// 🔥 Helyi értesítés küldése
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any,
  delaySeconds: number = 0
) {
  try {
    const trigger = delaySeconds > 0 ? { seconds: delaySeconds } : null;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger as any,
    });

  } catch (error) {
    console.error("❌ Helyi értesítés küldési hiba:", error);
  }
}

// 🔥 Összes értesítés törlése
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();

}

// 🔥 Badge szám frissítése
export async function updateBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);

}

// 🔥 Értesítés ütemezése időponthoz
export async function scheduleAppointmentReminder(
  appointmentId: string,
  title: string,
  startTime: Date,
  reminderMinutes: number = 60
) {
  const reminderTime = new Date(startTime.getTime() - reminderMinutes * 60 * 1000);
  const now = new Date();

  if (reminderTime <= now) {

    return;
  }

  const secondsUntilReminder = Math.floor(
    (reminderTime.getTime() - now.getTime()) / 1000
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "📅 Időpont emlékeztető",
      body: `${title} - ${startTime.toLocaleTimeString("hu-HU", {
        hour: "2-digit",
        minute: "2-digit",
      })}-kor kezdődik`,
      data: {
        type: "appointment",
        appointmentId,
      },
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      seconds: secondsUntilReminder,
      channelId: "appointment-reminders",
    } as any,
  });

  console.log(
    `✅ Időpont emlékeztető ütemezve: ${title} (${reminderMinutes} perccel előtte)`
  );
}

// 🔥 Heti mérés emlékeztető ütemezése
export async function scheduleMeasurementReminder() {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 - now.getDay() + 7) % 7));
  nextMonday.setHours(9, 0, 0, 0);

  const secondsUntilMonday = Math.floor(
    (nextMonday.getTime() - now.getTime()) / 1000
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "📏 Heti mérés emlékeztető",
      body: "Ideje rögzíteni a heti méréseidet! 📊",
      data: { type: "measurement_reminder" },
      sound: "default",
    },
    trigger: {
      seconds: secondsUntilMonday,
      repeats: true,
      channelId: "workout-reminders",
    } as any,
  });

}

// 🔥 Edzés emlékeztető ütemezése
export async function scheduleWorkoutReminder(
  workoutName: string,
  workoutTime: Date,
  reminderMinutes: number = 60
) {
  const reminderTime = new Date(workoutTime.getTime() - reminderMinutes * 60 * 1000);
  const now = new Date();

  if (reminderTime <= now) {

    return;
  }

  const secondsUntilReminder = Math.floor(
    (reminderTime.getTime() - now.getTime()) / 1000
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💪 Edzés emlékeztető",
      body: `${workoutName} - ${workoutTime.toLocaleTimeString("hu-HU", {
        hour: "2-digit",
        minute: "2-digit",
      })}-kor kezdődik`,
      data: { type: "workout_reminder", workoutName },
      sound: "default",
    },
    trigger: {
      seconds: secondsUntilReminder,
      channelId: "workout-reminders",
    } as any,
  });

}

// 🔥 Értesítési beállítások ellenőrzése
export async function checkNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}
