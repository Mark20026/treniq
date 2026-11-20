import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import { supabase } from "../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../services/i18n";

const categories = [
  { id: "workout_plan", label: "Edzésterv", icon: "barbell-outline" },
  { id: "nutrition", label: "Étrend", icon: "restaurant-outline" },
  { id: "progress_photo", label: "Progress kép", icon: "camera-outline" },
  { id: "video_tutorial", label: "Videó", icon: "videocam-outline" },
  { id: "other", label: "Egyéb", icon: "document-outline" },
];

// 🔒 Biztonsági whitelist
const ALLOWED_EXTENSIONS: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  mp4: "video/mp4",
  mov: "video/quicktime",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

const MAX_FILE_SIZE = {
  video_tutorial: 200 * 1024 * 1024,
  default: 25 * 1024 * 1024,
};

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function sanitizeExtension(fileName: string): string | null {
  const parts = fileName.split(".");
  if (parts.length < 2) return null;
  const ext = parts.pop()!.toLowerCase().trim();
  if (!/^[a-z0-9]+$/.test(ext)) return null;
  if (!ALLOWED_EXTENSIONS[ext]) return null;
  return ext;
}

export default function FileUploadScreen() {
  const [selectedCategory, setSelectedCategory] = useState("progress_photo");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size?: number;
  } | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToLanguageChange((lang) => {
      // nyelv váltás kezelése
    });
    return () => unsubscribe();
  }, []);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Engedély szükséges",
          "A képgaléria eléréséhez engedélyre van szükség.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || "image/jpeg",
          size: asset.fileSize,
        });
      }
    } catch (error) {
      console.error("Kép választási hiba:", error);
      Alert.alert("Hiba", "Nem sikerült képet választani.");
    }
  };

  const pickVideo = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Engedély szükséges",
          "A videók eléréséhez engedélyre van szükség.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `video_${Date.now()}.mp4`,
          type: asset.type || "video/mp4",
          size: asset.fileSize,
        });
      }
    } catch (error) {
      console.error("Videó választási hiba:", error);
      Alert.alert("Hiba", "Nem sikerült videót választani.");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/*",
        ],
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
        size: asset.size,
      });
    } catch (error) {
      console.error("Dokumentum választási hiba:", error);
      Alert.alert("Hiba", "Nem sikerült dokumentumot választani.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert("Hiba", "Kérlek, válassz egy fájlt!");
      return;
    }

    const ext = sanitizeExtension(selectedFile.name);
    if (!ext) {
      Alert.alert(
        "Nem engedélyezett fájltípus",
        "Csak kép, videó, PDF, Word vagy szöveges fájl tölthető fel.",
      );
      return;
    }

    const sizeLimit =
      selectedCategory === "video_tutorial"
        ? MAX_FILE_SIZE.video_tutorial
        : MAX_FILE_SIZE.default;
    if (selectedFile.size && selectedFile.size > sizeLimit) {
      Alert.alert(
        "Túl nagy fájl",
        `A maximális fájlméret ${(sizeLimit / (1024 * 1024)).toFixed(0)} MB.`,
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert(
          "Hiba",
          "Nem vagy bejelentkezve! Kérlek, jelentkezz be újra.",
        );
        setLoading(false);
        return;
      }

      const user = session.user;

      // 🔥 Kliens profil lekérése a coach_id miatt
      const { data: clientProfile, error: clientError } = await supabase
        .from("clients")
        .select("coach_id")
        .eq("id", user.id)
        .single();

      if (clientError || !clientProfile) {
        Alert.alert("Hiba", "Nem található a kliens profilod!");
        setLoading(false);
        return;
      }

      const coachId = clientProfile.coach_id;

      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = base64ToArrayBuffer(base64);

      const mimeType = ALLOWED_EXTENSIONS[ext];
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${user.id}/${coachId}/${selectedCategory}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("client-files")
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("client-files")
          .createSignedUrl(filePath, 3600);

      if (signedUrlError) throw signedUrlError;

      // 🔥 coach_id a clientProfile-ból
      const { error: dbError } = await supabase.from("client_files").insert({
        client_id: user.id,
        coach_id: coachId,
        file_name: selectedFile.name,
        file_path: filePath,
        file_url: filePath,
        file_type: mimeType,
        file_size: selectedFile.size || 0,
        category: selectedCategory,
        uploaded_by: "client",
        description: "",
      });

      if (dbError) throw dbError;

      Alert.alert("Siker!", "Fájl sikeresen feltöltve!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Feltöltési hiba:", error);
      Alert.alert("Hiba", error?.message || "Nem sikerült feltölteni a fájlt.");
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen
        options={{
          title: "Fájl feltöltés",
          headerTitleStyle: { color: "#F8FAFC", fontWeight: "600" },
          headerStyle: { backgroundColor: "#090D16" },
          headerTintColor: "#38BDF8",
          headerBackTitle: "Vissza",
        }}
      />

      <View style={styles.content}>
        <Text style={styles.title}>📤 Fájl feltöltése</Text>
        <Text style={styles.subtitle}>
          Tölts fel progress képet, edzéstervet vagy más dokumentumot
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategória</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id &&
                    styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color={
                    selectedCategory === category.id ? "#090D16" : "#64748B"
                  }
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category.id &&
                      styles.categoryLabelActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fájl kiválasztása</Text>

          {!selectedFile ? (
            <View style={styles.pickerGrid}>
              <TouchableOpacity style={styles.pickerButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={28} color="#38BDF8" />
                <Text style={styles.pickerLabel}>Kép</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerButton} onPress={pickVideo}>
                <Ionicons name="videocam-outline" size={28} color="#38BDF8" />
                <Text style={styles.pickerLabel}>Videó</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={pickDocument}
              >
                <Ionicons name="document-outline" size={28} color="#38BDF8" />
                <Text style={styles.pickerLabel}>Dokumentum</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.selectedFileContainer}>
              <View style={styles.selectedFileInfo}>
                <Ionicons
                  name={
                    selectedFile.type.startsWith("image/")
                      ? "image-outline"
                      : selectedFile.type.startsWith("video/")
                        ? "videocam-outline"
                        : "document-text-outline"
                  }
                  size={32}
                  color="#38BDF8"
                />
                <View style={styles.selectedFileDetails}>
                  <Text style={styles.selectedFileName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={styles.selectedFileSize}>
                    {selectedFile.size
                      ? (selectedFile.size / 1024).toFixed(1) + " KB"
                      : "Ismeretlen méret"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={clearSelection}
                  style={styles.removeFileButton}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedFile || loading) && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={!selectedFile || loading}
        >
          {loading ? (
            <ActivityIndicator color="#090D16" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#090D16" />
              <Text style={styles.uploadButtonText}>Fájl feltöltése</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090D16" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#F8FAFC", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748B", marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 12,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#131C2E",
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  categoryButtonActive: { backgroundColor: "#38BDF8", borderColor: "#38BDF8" },
  categoryLabel: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  categoryLabelActive: { color: "#090D16" },
  pickerGrid: { flexDirection: "row", gap: 12 },
  pickerButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    backgroundColor: "#131C2E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1C2638",
    gap: 8,
  },
  pickerLabel: { fontSize: 13, color: "#94A3B8", fontWeight: "500" },
  selectedFileContainer: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#38BDF8",
  },
  selectedFileInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  selectedFileDetails: { flex: 1 },
  selectedFileName: { fontSize: 14, fontWeight: "600", color: "#F8FAFC" },
  selectedFileSize: { fontSize: 12, color: "#64748B", marginTop: 2 },
  removeFileButton: { padding: 4 },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#38BDF8",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
  },
  uploadButtonDisabled: { opacity: 0.5 },
  uploadButtonText: { fontSize: 16, fontWeight: "700", color: "#090D16" },
});
