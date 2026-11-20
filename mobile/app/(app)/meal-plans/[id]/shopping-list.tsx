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
import { useLocalSearchParams, Stack } from "expo-router";
import { supabase } from "../../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../../services/i18n";

export default function ShoppingListScreen() {
  const { id }=useLocalSearchParams<{ id: string }>();
  const [loading, setLoading]=useState(true);
  const [shoppingList, setShoppingList]=useState<string>("");
  const [options, setOptions]=useState<string>("");
  const [notes, setNotes]=useState<string>("");
  const [planName, setPlanName]=useState<string>("");
  const [currentLang, setCurrentLang]=useState(getCurrentLanguage());

  const fetchData=React.useCallback(async function() {
    return Promise.resolve(supabase.auth.getUser()).then(async (loaded) => {
      const {
        data: { user },
      }=loaded;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error }=await supabase
        .from("meal_plans")
        .select("name, shopping_list, options, notes")
        .eq("id", id)
        .eq("client_id", user.id)
        .single();

      if (error) {
        console.error("Hiba a bevásárlólista lekérésekor:", error);
      } else if (data) {
        setPlanName(data.name);
        setShoppingList(data.shopping_list||"");
        setOptions(data.options||"");
        setNotes(data.notes||"");
      }
      setLoading(false);

    });
  }, [id]);

  const getItems=() => {
    if (!shoppingList) return [];
    return shoppingList.split("\n").filter((item) => item.trim()!=="");
  };

  const getOptionsItems=() => {
    if (!options) return [];
    return options.split("\n").filter((item) => item.trim()!=="");
  };


  useEffect(() => {
    fetchData();
    const unsubscribe=subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });
    return () => unsubscribe();
  }, [id, fetchData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  const items=getItems();
  const optionsItems=getOptionsItems();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen
        options={{
          title: "Bevásárlólista",
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
        <View style={styles.header}>
          <Text style={styles.planName}>{planName}</Text>
          <Text style={styles.headerSubtitle}>🛒 Bevásárlólista</Text>
        </View>

        {items.length===0&&optionsItems.length===0? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={32} color="#475569" />
            </View>
            <Text style={styles.emptyTitle}>Nincs bevásárlólista</Text>
            <Text style={styles.emptyText}>
              Ehhez az étrendhez még nem tartozik bevásárlólista.
            </Text>
          </View>
        ):(
          <>
            {/* Bevásárlólista */}
            {items.length>0&&(
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="cart-outline" size={18} color="#38BDF8" />
                  <Text style={styles.sectionTitle}>Bevásárlólista</Text>
                  <Text style={styles.itemCount}>{items.length} tétel</Text>
                </View>

                {items.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.bulletPoint}>
                      <View style={styles.bulletDot} />
                    </View>
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Opciók / Helyettesítések */}
            {optionsItems.length>0&&(
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={18}
                    color="#F59E0B"
                  />
                  <Text style={[styles.sectionTitle, { color: "#F59E0B" }]}>
                    Helyettesítések
                  </Text>
                  <Text style={styles.itemCount}>
                    {optionsItems.length} opció
                  </Text>
                </View>

                {optionsItems.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View
                      style={[
                        styles.bulletPoint,
                        { backgroundColor: "rgba(245, 158, 11, 0.1)" },
                      ]}
                    >
                      <View
                        style={[
                          styles.bulletDot,
                          { backgroundColor: "#F59E0B" },
                        ]}
                      />
                    </View>
                    <Text style={[styles.listItemText, { color: "#F59E0B" }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Megjegyzések */}
            {notes&&(
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color="#64748B"
                  />
                  <Text style={[styles.sectionTitle, { color: "#64748B" }]}>
                    Megjegyzések
                  </Text>
                </View>
                <View style={styles.notesContainer}>
                  <Text style={styles.notesText}>{notes}</Text>
                </View>
              </View>
            )}
          </>
        )}
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
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    flex: 1,
  },
  itemCount: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C2638",
  },
  bulletPoint: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#38BDF8",
  },
  listItemText: {
    fontSize: 14,
    color: "#F8FAFC",
    flex: 1,
  },
  notesContainer: {
    backgroundColor: "#131C2E",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  notesText: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
  },
});
