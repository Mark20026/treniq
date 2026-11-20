import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  StatusBar,
  Switch,
  Modal,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { supabase } from "../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
  changeLanguage,
  type Language,
} from "../../services/i18n";
import { scheduleMeasurementReminder } from "../../services/notificationService";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import * as Linking from "expo-linking";

interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string|null;
  birth_date: string|null;
  address: string|null;
  weight_goal: number|null;
}

export default function ProfileScreen() {
  const [profile, setProfile]=useState<ClientProfile|null>(null);
  const [loading, setLoading]=useState(true);
  const [editing, setEditing]=useState(false);
  const [showGoalEditor, setShowGoalEditor]=useState(false);
  const [showPasswordModal, setShowPasswordModal]=useState(false);
  const [showSettingsModal, setShowSettingsModal]=useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal]=useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText]=useState("");
  const [passwordData, setPasswordData]=useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [tempWeightGoal, setTempWeightGoal]=useState("");
  const [saving, setSaving]=useState(false);
  const [currentLang, setCurrentLang]=useState(getCurrentLanguage());
  const [showLanguageModal, setShowLanguageModal]=useState(false);

  // Értesítési beállítások
  const [notificationSettings, setNotificationSettings]=useState({
    workoutReminder: true,
    measurementReminder: true,
    messageNotification: true,
    appointmentReminder: true,
  });

  const [formData, setFormData]=useState({
    full_name: "",
    phone: "",
    address: "",
  });

  const languages=[
    { code: "hu", label: "Magyar", flag: "🇭🇺" },
    { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];

  const fetchProfile=React.useCallback(async function() {

    return Promise.resolve(supabase.auth.getUser()).then(async (loaded) => {
      const { data: { user }, error: authError }=loaded;

      if (authError) throw authError;
      if (!user) { setProfile(null); return; }
      const { data, error }=await supabase.from("clients")
        .select("id, full_name, email, phone, birth_date, address, weight_goal")
        .eq("id", user.id).single();
      if (error) throw error;
      setProfile(data);
      setFormData({ full_name: data.full_name, phone: data.phone??"", address: data.address??"" });

    }).catch(async (error) => {
      Alert.alert(t("errors:generic"));
    }).finally(() => { setLoading(false); });
  }, []);

  const loadNotificationSettings=React.useCallback(async () => {

    return Promise.resolve(SecureStore.getItemAsync("notification_settings")).then(async (loaded) => {
      const settings=loaded;

      if (settings) {
        setNotificationSettings(JSON.parse(settings));
      }

    }).catch(async (error) => {
      console.error("Értesítési beállítások betöltési hiba:", error);
    });
  }, []);

  // 🔥 getInitials függvény
  const getInitials=(name: string) => {
    if (!name) return "K";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // 🔥 Értesítési beállítások betöltése


  const saveNotificationSetting=async (key: string, value: boolean) => {
    try {
      const updated={ ...notificationSettings, [key]: value };
      setNotificationSettings(updated);
      await SecureStore.setItemAsync(
        "notification_settings",
        JSON.stringify(updated),
      );

      // 🔥 Ha be van kapcsolva, ütemezzük az emlékeztetőket
      if (value) {
        switch (key) {
          case "measurementReminder":
            await scheduleMeasurementReminder();
            break;
          case "workoutReminder":
            // Itt lehet ütemezni az edzés emlékeztetőket
            break;
          case "appointmentReminder":
            // Itt lehet ütemezni az időpont emlékeztetőket
            break;
        }
      } else {
        // Ha ki van kapcsolva, töröljük az összes értesítést
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      console.error("Értesítési beállítás mentési hiba:", error);
    }
  };

  // 🔥 Nyelvváltás
  const changeLanguageHandler=async (langCode: Language) => {
    await changeLanguage(langCode);
    setCurrentLang(langCode);
    setShowLanguageModal(false);
  };

  // 🔥 Kijelentkezés
  const handleLogout=async () => {
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
            console.error("Kijelentkezési hiba:", error);
          }
        },
      },
    ]);
  };

  async function updateProfile() {
    if (!formData.full_name.trim()) {
      Alert.alert(t("errors:generic"), t("profile:nameRequired"));
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      }=await supabase.auth.getUser();
      if (!user) return;

      const { error }=await supabase.from("clients").upsert(
        {
          id: user.id,
          full_name: formData.full_name.trim(),
          phone: formData.phone||null,
          address: formData.address||null,
          email: user.email,
        },
        { onConflict: "id", ignoreDuplicates: false },
      );

      if (error) throw error;

      const { error: metadataError }=await supabase.auth.updateUser({
        data: { full_name: formData.full_name.trim() },
      });

      if (metadataError) throw metadataError;

      Alert.alert(t("common:success"), t("profile:updateSuccess"));
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      console.error("Update error:", error);
      Alert.alert(t("errors:generic"), error.message||t("errors:generic"));
    } finally {
      setSaving(false);
    }
  }

  async function updateWeightGoal() {
    const goal=parseFloat(tempWeightGoal);
    if (isNaN(goal)||goal<20||goal>300) {
      Alert.alert(t("errors:generic"), t("profile:invalidWeightGoal"));
      return;
    }

    setSaving(true);
    try {
      const { error }=await supabase
        .from("clients")
        .update({ weight_goal: goal })
        .eq("id", profile?.id);

      if (error) throw error;

      setProfile((prev) => (prev? { ...prev, weight_goal: goal }:prev));
      setShowGoalEditor(false);
      Alert.alert(t("common:success"), t("profile:weightGoalUpdated"));
    } catch (error) {
      Alert.alert(t("errors:generic"), t("errors:generic"));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (passwordData.newPassword!==passwordData.confirmPassword) {
      Alert.alert(t("errors:generic"), t("profile:passwordMismatch"));
      return;
    }
    if (passwordData.newPassword.length<6) {
      Alert.alert(t("errors:generic"), t("profile:passwordTooShort"));
      return;
    }

    setSaving(true);
    try {
      const { error }=await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      Alert.alert(t("common:success"), t("profile:passwordChanged"));
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      Alert.alert(t("errors:generic"), error.message||t("errors:generic"));
    } finally {
      setSaving(false);
    }
  }

  // ELSŐ LÉPÉS: Fióktörlés megerősítés kérése
  const requestDeleteAccount=() => {
    setDeleteConfirmationText("");
    setShowConfirmDeleteModal(true);
  };

  // MÁSODIK LÉPÉS: Végleges törlés (megerősítés után)
  async function permanentDeleteAccount() {
    const confirmWord=
      currentLang==="hu"
        ? "TORLES"
        :currentLang==="sk"
          ? "ZMAZAŤ"
          :"DELETE";

    if (deleteConfirmationText!==confirmWord) {
      Alert.alert(t("errors:generic"), t("profile:confirmDeleteText"));
      return;
    }

    setSaving(true);
    setShowConfirmDeleteModal(false);

    try {
      const {
        data: { user },
      }=await supabase.auth.getUser();
      if (!user) throw new Error("Nincs bejelentkezve");

      const { error: deleteClientError }=await supabase
        .from("clients")
        .delete()
        .eq("id", user.id);

      if (deleteClientError) throw deleteClientError;

      const { error: signOutError }=await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      Alert.alert(
        t("profile:accountDeleted"),
        t("profile:accountDeletedMessage"),
      );
    } catch (error: any) {
      console.error("Delete account error:", error);
      Alert.alert(t("errors:generic"), error.message||t("errors:generic"));
    } finally {
      setSaving(false);
    }
  }

  // 🔥 Settings modal nyitás/bezárás
  const openSettings=() => setShowSettingsModal(true);
  const closeSettings=() => setShowSettingsModal(false);


  useEffect(() => {
    fetchProfile();
    loadNotificationSettings();

    const unsubscribe=subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });

    return () => unsubscribe();
  }, [fetchProfile, loadNotificationSettings]);


  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar és név */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {getInitials(
                editing? formData.full_name:profile?.full_name||"",
              )}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {editing
              ? formData.full_name||t("profile:newClient")
              :profile?.full_name}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>

        {/* ⚙️ BEÁLLÍTÁSOK GOMB */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={openSettings}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={20} color="#38BDF8" />
          <Text style={styles.settingsButtonText}>Beállítások</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color="#475569"
            style={styles.settingsChevron}
          />
        </TouchableOpacity>

        {/* Célok szekció */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 {t("profile:goals")}</Text>

          <TouchableOpacity
            style={styles.goalCard}
            onPress={() => {
              setTempWeightGoal(profile?.weight_goal?.toString()||"");
              setShowGoalEditor(true);
            }}
          >
            <View style={styles.goalCardContent}>
              <View style={styles.goalIcon}>
                <Ionicons name="scale" size={20} color="#F59E0B" />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalLabel}>{t("profile:weightGoal")}</Text>
                <Text style={styles.goalValue}>
                  {profile?.weight_goal
                    ? `${profile.weight_goal} ${t("common:kg")}`
                    :t("profile:notSet")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </View>
          </TouchableOpacity>
        </View>

        {!editing? (
          // MEGTEKINTŐ MÓD
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                👤 {t("profile:personalData")}
              </Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="person-outline" size={18} color="#38BDF8" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>
                      {t("profile:fullName")}
                    </Text>
                    <Text style={styles.infoValue}>
                      {profile?.full_name||"-"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="mail-outline" size={18} color="#38BDF8" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t("profile:email")}</Text>
                    <Text style={styles.infoValue}>
                      {profile?.email||"-"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="call-outline" size={18} color="#38BDF8" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t("profile:phone")}</Text>
                    <Text style={styles.infoValue}>
                      {profile?.phone||t("profile:notSpecified")}
                    </Text>
                  </View>
                </View>

                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#38BDF8"
                    />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t("profile:address")}</Text>
                    <Text style={styles.infoValue}>
                      {profile?.address||t("profile:notSpecified")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Gombok */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="create-outline" size={18} color="#090D16" />
              <Text style={styles.editButtonText}>
                {t("profile:editProfile")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.passwordButton}
              onPress={() => setShowPasswordModal(true)}
            >
              <Ionicons name="key-outline" size={18} color="#38BDF8" />
              <Text style={styles.passwordButtonText}>
                {t("profile:changePassword")}
              </Text>
            </TouchableOpacity>
          </>
        ):(
          // SZERKESZTŐ MÓD
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✏️ {t("common:edit")}</Text>
              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("profile:fullName")} *
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color="#475569"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.full_name}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, full_name: text }))
                      }
                      placeholder={t("profile:fullNamePlaceholder")}
                      placeholderTextColor="#475569"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("profile:phone")}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color="#475569"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.phone}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, phone: text }))
                      }
                      placeholder={t("profile:phonePlaceholder")}
                      placeholderTextColor="#475569"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("profile:address")}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#475569"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.address}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, address: text }))
                      }
                      placeholder={t("profile:addressPlaceholder")}
                      placeholderTextColor="#475569"
                    />
                  </View>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditing(false);
                      if (profile) {
                        setFormData({
                          full_name: profile.full_name||"",
                          phone: profile.phone||"",
                          address: profile.address||"",
                        });
                      }
                    }}
                  >
                    <Text style={styles.cancelButtonText}>
                      {t("common:cancel")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={updateProfile}
                    disabled={saving}
                  >
                    {saving? (
                      <ActivityIndicator size="small" color="#090D16" />
                    ):(
                      <Text style={styles.saveButtonText}>
                        {t("common:save")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Súlycél szerkesztő Modal */}
      <Modal visible={showGoalEditor} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("profile:setWeightGoal")}
              </Text>
              <TouchableOpacity onPress={() => setShowGoalEditor(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>
              {t("profile:goalWeight")} ({t("common:kg")})
            </Text>
            <TextInput
              style={styles.modalInput}
              value={tempWeightGoal}
              onChangeText={setTempWeightGoal}
              keyboardType="numeric"
              placeholder="75"
            />
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={updateWeightGoal}
              disabled={saving}
            >
              <Text style={styles.modalSaveText}>{t("common:save")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Jelszóváltoztatás Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("profile:changePassword")}
              </Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>{t("profile:newPassword")}</Text>
            <TextInput
              style={styles.modalInput}
              value={passwordData.newPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, newPassword: text }))
              }
              secureTextEntry
              placeholder={t("profile:newPassword")}
            />

            <Text style={styles.modalLabel}>
              {t("profile:confirmPassword")}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={passwordData.confirmPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, confirmPassword: text }))
              }
              secureTextEntry
              placeholder={t("profile:confirmPassword")}
            />

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={changePassword}
              disabled={saving}
            >
              <Text style={styles.modalSaveText}>
                {t("profile:changePassword")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🔥 BEÁLLÍTÁSOK MODAL */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSettings}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={closeSettings}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ Beállítások</Text>
              <TouchableOpacity onPress={closeSettings}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              {/* 🌐 Nyelv */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>🌐 Nyelv</Text>
                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={() => setShowLanguageModal(true)}
                >
                  <View style={styles.settingsItemLeft}>
                    <Ionicons name="globe-outline" size={20} color="#38BDF8" />
                    <Text style={styles.settingsItemLabel}>Nyelv</Text>
                  </View>
                  <View style={styles.settingsItemRight}>
                    <Text style={styles.settingsItemValue}>
                      {languages.find((l) => l.code===currentLang)?.flag}{" "}
                      {languages.find((l) => l.code===currentLang)?.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#475569"
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* 🔔 Értesítések */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>🔔 Értesítések</Text>

                <View style={styles.settingsItem}>
                  <View style={styles.settingsItemLeft}>
                    <Ionicons
                      name="barbell-outline"
                      size={20}
                      color="#38BDF8"
                    />
                    <Text style={styles.settingsItemLabel}>
                      Edzés emlékeztető
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.workoutReminder}
                    onValueChange={(value) =>
                      saveNotificationSetting("workoutReminder", value)
                    }
                    trackColor={{ false: "#1E293B", true: "#38BDF8" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.settingsItem}>
                  <View style={styles.settingsItemLeft}>
                    <Ionicons
                      name="fitness-outline"
                      size={20}
                      color="#10B981"
                    />
                    <Text style={styles.settingsItemLabel}>
                      Mérés emlékeztető
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.measurementReminder}
                    onValueChange={(value) =>
                      saveNotificationSetting("measurementReminder", value)
                    }
                    trackColor={{ false: "#1E293B", true: "#38BDF8" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.settingsItem}>
                  <View style={styles.settingsItemLeft}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color="#8B5CF6"
                    />
                    <Text style={styles.settingsItemLabel}>Új üzenet</Text>
                  </View>
                  <Switch
                    value={notificationSettings.messageNotification}
                    onValueChange={(value) =>
                      saveNotificationSetting("messageNotification", value)
                    }
                    trackColor={{ false: "#1E293B", true: "#38BDF8" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
                  <View style={styles.settingsItemLeft}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#F59E0B"
                    />
                    <Text style={styles.settingsItemLabel}>
                      Időpont emlékeztető
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.appointmentReminder}
                    onValueChange={(value) =>
                      saveNotificationSetting("appointmentReminder", value)
                    }
                    trackColor={{ false: "#1E293B", true: "#38BDF8" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* 📱 Alkalmazás */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>📱 Alkalmazás</Text>

                <View style={styles.settingsItem}>
                  <View style={styles.settingsItemLeft}>
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color="#38BDF8"
                    />
                    <Text style={styles.settingsItemLabel}>Verzió</Text>
                  </View>
                  <Text style={styles.versionText}>
                    v{Constants.expoConfig?.version||"1.0.0"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={() =>
                    Linking.openURL("https://treniq.com/privacy-policy")
                  }
                >
                  <View style={styles.settingsItemLeft}>
                    <Ionicons name="shield-outline" size={20} color="#38BDF8" />
                    <Text style={styles.settingsItemLabel}>
                      Adatvédelmi irányelvek
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#475569" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsItem, { borderBottomWidth: 0 }]}
                  onPress={() => Linking.openURL("https://treniq.com/terms")}
                >
                  <View style={styles.settingsItemLeft}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="#38BDF8"
                    />
                    <Text style={styles.settingsItemLabel}>ÁSZF</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* 👤 Fiók */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>👤 Fiók</Text>

                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={handleLogout}
                >
                  <View style={styles.settingsItemLeft}>
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color="#EF4444"
                    />
                    <Text
                      style={[styles.settingsItemLabel, { color: "#EF4444" }]}
                    >
                      Kijelentkezés
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsItem, { borderBottomWidth: 0 }]}
                  onPress={requestDeleteAccount}
                >
                  <View style={styles.settingsItemLeft}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text
                      style={[styles.settingsItemLabel, { color: "#EF4444" }]}
                    >
                      Fiók törlése
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🔥 NYELV VÁLASZTÓ MODAL */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowLanguageModal(false)}
            activeOpacity={1}
          />
          <View style={[styles.modalContent, { maxWidth: 300 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nyelv kiválasztása</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLang===lang.code&&styles.languageOptionActive,
                ]}
                onPress={() => changeLanguageHandler(lang.code as Language)}
              >
                <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageOptionLabel,
                    currentLang===lang.code&&
                    styles.languageOptionLabelActive,
                  ]}
                >
                  {lang.label}
                </Text>
                {currentLang===lang.code&&(
                  <Ionicons name="checkmark" size={20} color="#38BDF8" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* FIÓKTÖRLÉS - ELSŐ LÉPÉS: Megerősítő Modal */}
      <Modal
        visible={showConfirmDeleteModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#1E293B" }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: "#EF4444" }]}>
                ⚠️ {t("profile:permanentDelete")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowConfirmDeleteModal(false)}
              >
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.deleteWarningText}>
              {t("profile:deleteWarning")}
            </Text>

            <Text style={styles.deleteConfirmText}>
              {t("profile:confirmDeleteInstruction")}
              <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                {" "}
                {currentLang==="hu"
                  ? "TORLES"
                  :currentLang==="sk"
                    ? "ZMAZAŤ"
                    :"DELETE"}
              </Text>
            </Text>

            <TextInput
              style={styles.deleteConfirmInput}
              value={deleteConfirmationText}
              onChangeText={setDeleteConfirmationText}
              placeholder={
                currentLang==="hu"
                  ? "TORLES"
                  :currentLang==="sk"
                    ? "ZMAZAŤ"
                    :"DELETE"
              }
              placeholderTextColor="#475569"
              textAlign="center"
              autoCapitalize="characters"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>{t("common:cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={permanentDeleteAccount}
                disabled={saving}
              >
                <Text style={styles.modalDeleteText}>
                  {saving? t("common:loading"):t("profile:permanentDelete")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// 🔥 STÍLUSOK
const styles=StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderWidth: 2,
    borderColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#38BDF8",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },

  // Settings button
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  settingsButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
    marginLeft: 12,
    flex: 1,
  },
  settingsChevron: {
    marginLeft: "auto",
  },

  // Szekciók
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },

  // Cél kártyák
  goalCard: {
    backgroundColor: "#131C2E",
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  goalCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  goalValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
    marginTop: 2,
  },

  // Információs kártyák
  infoCard: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(56, 189, 248, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
  },

  // Gombok
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#38BDF8",
    padding: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  editButtonText: {
    color: "#090D16",
    fontSize: 15,
    fontWeight: "700",
  },
  passwordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    padding: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.15)",
  },
  passwordButtonText: {
    color: "#38BDF8",
    fontSize: 15,
    fontWeight: "600",
  },

  // Szerkesztő form
  formCard: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#090D16",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#F8FAFC",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "rgba(71, 85, 105, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.2)",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#38BDF8",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#090D16",
    fontSize: 15,
    fontWeight: "700",
  },

  // Modalok
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#131C2E",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  modalScroll: {
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#090D16",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#F8FAFC",
    marginBottom: 16,
  },
  modalSaveButton: {
    backgroundColor: "#38BDF8",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSaveText: {
    color: "#090D16",
    fontSize: 15,
    fontWeight: "700",
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  modalDeleteText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },

  // Settings modal
  settingsSection: {
    marginBottom: 16,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    overflow: "hidden",
  },
  settingsSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1C2638",
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  settingsItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  settingsItemLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#F8FAFC",
  },
  settingsItemValue: {
    fontSize: 12,
    color: "#64748B",
  },
  versionText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },

  // Language modal
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  languageOptionActive: {
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  languageOptionFlag: {
    fontSize: 20,
  },
  languageOptionLabel: {
    flex: 1,
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "500",
  },
  languageOptionLabelActive: {
    color: "#38BDF8",
    fontWeight: "600",
  },

  // Fióktörlés specifikus stílusok
  deleteWarningText: {
    fontSize: 14,
    color: "#F8FAFC",
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  deleteConfirmText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
    textAlign: "center",
  },
  deleteConfirmInput: {
    backgroundColor: "#090D16",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: "bold",
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 2,
  },
});
