import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { BackgroundGlow, Skeleton } from "../src/components";
import { useStore } from "../src/store/useStore";
import { ThemeProvider, useTheme } from "../src/theme";

function HydrationSkeleton() {
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

function RootNavigator() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <HydrationSkeleton />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="event/[id]" />
    </Stack>
  );
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
