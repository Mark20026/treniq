import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { router, useFocusEffect, Link } from "expo-router";
import { supabase } from "../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../services/i18n";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

interface ClientFile {
  id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  category: string;
  description: string | null;
  uploaded_by: string;
  created_at: string;
}

const categories = [
  { id: "all", label: "Összes", icon: "folder-outline" },
  { id: "workout_plan", label: "Edzésterv", icon: "barbell-outline" },
  { id: "nutrition", label: "Étrend", icon: "restaurant-outline" },
  { id: "progress_photo", label: "Progress képek", icon: "camera-outline" },
  { id: "video_tutorial", label: "Videók", icon: "videocam-outline" },
  { id: "other", label: "Egyéb", icon: "document-outline" },
];

export default function FilesScreen() {
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  useEffect(() => {
    fetchFiles();
    const unsubscribe = subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFiles();
    }, [selectedCategory]),
  );

  async function fetchFiles() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("client_files")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFiles(await Promise.all((data || []).map(async file => {
        const { data: signed } = await supabase.storage.from("client-files").createSignedUrl(file.file_path, 3600);
        return { ...file, file_url: signed?.signedUrl ?? "" };
      })));
      setError(null);
    } catch (err: any) {
      setError(err.message || t("errors:generic"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  const getFileIcon = (fileType: string, category: string): any => {
    if (fileType.startsWith("image/")) return "image-outline";
    if (fileType.startsWith("video/")) return "videocam-outline";
    if (fileType === "application/pdf") return "document-text-outline";

    switch (category) {
      case "workout_plan":
        return "barbell-outline";
      case "nutrition":
        return "restaurant-outline";
      case "progress_photo":
        return "camera-outline";
      case "video_tutorial":
        return "videocam-outline";
      default:
        return "document-outline";
    }
  };

  const getFileColor = (category: string) => {
    switch (category) {
      case "workout_plan":
        return "#38BDF8";
      case "nutrition":
        return "#10B981";
      case "progress_photo":
        return "#8B5CF6";
      case "video_tutorial":
        return "#EF4444";
      default:
        return "#64748B";
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = categories.find((c) => c.id === category);
    return found?.label || category;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownload = async (file: ClientFile) => {
    try {
      const fileUri = FileSystem.documentDirectory + file.file_name;
      const { uri } = await FileSystem.downloadAsync(file.file_url, fileUri);

      const isSharable = await Sharing.isAvailableAsync();
      if (isSharable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Letöltés kész", `A fájl letöltve: ${file.file_name}`, [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error("Letöltési hiba:", error);
      Alert.alert("Hiba", "Nem sikerült letölteni a fájlt.");
    }
  };

  const handleOpen = async (file: ClientFile) => {
    try {
      const isSharable = await Sharing.isAvailableAsync();
      if (isSharable) {
        await Sharing.shareAsync(file.file_url);
      } else {
        Alert.alert("Megnyitás", `URL: ${file.file_url}`, [{ text: "OK" }]);
      }
    } catch (error) {
      console.error("Megnyitási hiba:", error);
      Alert.alert("Hiba", "Nem sikerült megnyitni a fájlt.");
    }
  };

  const handleDelete = async (file: ClientFile) => {
    Alert.alert(
      "Fájl törlése",
      `Biztosan törölni szeretnéd a következő fájlt: ${file.file_name}?`,
      [
        { text: "Mégse", style: "cancel" },
        {
          text: "Törlés",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("client_files")
                .delete()
                .eq("id", file.id);

              if (error) throw error;
              fetchFiles();
            } catch (error) {
              Alert.alert("Hiba", "Nem sikerült törölni a fájlt.");
            }
          },
        },
      ],
    );
  };

  const getUploaderLabel = (uploadedBy: string) => {
    return uploadedBy === "coach" ? "👨‍🏫 Edző" : "👤 Te";
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFiles}>
          <Text style={styles.retryButtonText}>{t("common:refresh")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            📁 {t("files:title") || "Fájljaim"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {files.length} {t("files:files") || "fájl"}
          </Text>
        </View>

        {/* Kategória szűrő */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            const count = files.filter((f) =>
              category.id === "all" ? true : f.category === category.id,
            ).length;

            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  isSelected && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={isSelected ? "#090D16" : "#64748B"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                  ]}
                >
                  {category.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.categoryCount,
                      isSelected && styles.categoryCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryCountText,
                        isSelected && styles.categoryCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Fájlok lista */}
        {files.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="folder-open-outline" size={32} color="#475569" />
            </View>
            <Text style={styles.emptyTitle}>
              {t("files:noFiles") || "Nincs fájl"}
            </Text>
            <Text style={styles.emptyText}>
              {selectedCategory !== "all"
                ? `${t("files:noFilesInCategory") || "Ebben a kategóriában nincs fájl"}`
                : t("files:noFilesDesc") ||
                  "Az edződ még nem osztott meg veled fájlokat."}
            </Text>
          </View>
        ) : (
          files.map((file) => (
            <View key={file.id} style={styles.fileCard}>
              <View style={styles.fileHeader}>
                <View
                  style={[
                    styles.fileIcon,
                    { backgroundColor: getFileColor(file.category) + "15" },
                  ]}
                >
                  <Ionicons
                    name={getFileIcon(file.file_type, file.category)}
                    size={22}
                    color={getFileColor(file.category)}
                  />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.file_name}
                  </Text>
                  <View style={styles.fileMeta}>
                    <Text style={styles.fileMetaText}>
                      {formatFileSize(file.file_size)}
                    </Text>
                    <Text style={styles.fileMetaDot}>•</Text>
                    <Text style={styles.fileMetaText}>
                      {formatDate(file.created_at)}
                    </Text>
                    <Text style={styles.fileMetaDot}>•</Text>
                    <Text style={styles.fileMetaText}>
                      {getUploaderLabel(file.uploaded_by)}
                    </Text>
                  </View>
                </View>
              </View>

              {file.description && (
                <Text style={styles.fileDescription} numberOfLines={2}>
                  {file.description}
                </Text>
              )}

              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDownload(file)}
                >
                  <Ionicons name="download-outline" size={18} color="#38BDF8" />
                  <Text style={styles.actionText}>Letöltés</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.openButton]}
                  onPress={() => handleOpen(file)}
                >
                  <Ionicons name="open-outline" size={18} color="#10B981" />
                  <Text style={[styles.actionText, { color: "#10B981" }]}>
                    Megnyitás
                  </Text>
                </TouchableOpacity>

                {file.uploaded_by === "client" && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(file)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionText, { color: "#EF4444" }]}>
                      Törlés
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        {/* 🔥 Feltöltés gomb - JAVÍTVA */}
        <Link href="/files/upload" asChild>
          <TouchableOpacity style={styles.uploadButton}>
            <Ionicons name="cloud-upload-outline" size={20} color="#090D16" />
            <Text style={styles.uploadButtonText}>
              {t("files:uploadProgress") || "Progress kép feltöltése"}
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
    paddingHorizontal: 24,
    gap: 12,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
    fontWeight: "500",
  },
  categoriesScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  categoriesContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#131C2E",
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  categoryButtonActive: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  categoryTextActive: {
    color: "#090D16",
  },
  categoryCount: {
    backgroundColor: "#1C2638",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: "center",
  },
  categoryCountActive: {
    backgroundColor: "rgba(9, 13, 22, 0.15)",
  },
  categoryCountText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
  },
  categoryCountTextActive: {
    color: "#090D16",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#111726",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#182235",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
  },
  fileCard: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 2,
  },
  fileMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  fileMetaText: {
    fontSize: 11,
    color: "#64748B",
  },
  fileMetaDot: {
    fontSize: 11,
    color: "#1C2638",
  },
  fileDescription: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1C2638",
    lineHeight: 18,
  },
  fileActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1C2638",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  openButton: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#38BDF8",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#38BDF8",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#090D16",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: "#38BDF8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#090D16",
    fontWeight: "700",
    fontSize: 14,
  },
});
