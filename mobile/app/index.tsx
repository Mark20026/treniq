import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasSession(!!session);
      setIsLoading(false);
    };
    checkSession();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#090D16",
        }}
      >
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  // Ha van session, mehetünk az app-ba, különben a loginra
  if (hasSession) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
