import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { BackgroundGlow, Skeleton } from "../src/components";
import { isSupabaseConfigured } from "../src/lib/supabase";
import { BandSetupScreen } from "../src/screens/BandSetupScreen";
import { SignInScreen } from "../src/screens/SignInScreen";
import { withOfflineCache } from "../src/store/cachedCloudRepository";
import { useAuthStore } from "../src/store/useAuthStore";
import { createSupabaseRepository } from "../src/store/supabaseRepository";
import { useStore } from "../src/store/useStore";
import { ThemeProvider, useTheme } from "../src/theme";

const SKIP_SIGN_IN_KEY = "band-manager-pro/skip-sign-in";

function LoadingSkeleton() {
  const { spacing, radii } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <BackgroundGlow />
      <SafeAreaView style={{ flex: 1, padding: spacing.xl, gap: spacing.md }} edges={["top"]}>
        <Skeleton style={{ height: 42, width: 220, borderRadius: radii.md, marginBottom: spacing.sm }} />
        <Skeleton style={{ height: 132, borderRadius: radii.xl }} />
        <Skeleton style={{ height: 72, borderRadius: radii.xl }} />
        <Skeleton style={{ height: 140, borderRadius: radii.xl }} />
      </SafeAreaView>
    </View>
  );
}

function MainStack() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="event/[id]" />
    </Stack>
  );
}

/** Local-only mode: today's behavior, no auth, no cloud sync. */
function LocalOnlyNavigator() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return hydrated ? <MainStack /> : <LoadingSkeleton />;
}

/** Signed-in, band-synced mode: data lives in Supabase, cached locally for offline use. */
function CloudNavigator({ bandId }: { bandId: string }) {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);

  useEffect(() => {
    hydrate(withOfflineCache(createSupabaseRepository(bandId)));
  }, [bandId, hydrate]);

  return hydrated ? <MainStack /> : <LoadingSkeleton />;
}

function AuthGatedNavigator() {
  const authStatus = useAuthStore((s) => s.status);
  const band = useAuthStore((s) => s.band);
  const initAuth = useAuthStore((s) => s.init);
  const [skipped, setSkipped] = useState<boolean | null>(null);

  useEffect(() => {
    initAuth();
    AsyncStorage.getItem(SKIP_SIGN_IN_KEY).then((v) => setSkipped(v === "1"));
  }, [initAuth]);

  const handleSkip = () => {
    AsyncStorage.setItem(SKIP_SIGN_IN_KEY, "1");
    setSkipped(true);
  };

  if (skipped === null || authStatus === "loading") return <LoadingSkeleton />;
  if (skipped) return <LocalOnlyNavigator />;
  if (authStatus === "signedOut" || authStatus === "codeSent") return <SignInScreen onSkip={handleSkip} />;
  if (authStatus === "needsBand") return <BandSetupScreen />;
  return <CloudNavigator bandId={band!.id} />;
}

function RootNavigator() {
  return isSupabaseConfigured ? <AuthGatedNavigator /> : <LocalOnlyNavigator />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.scheme === "dark" ? "light" : "dark"} />;
}
