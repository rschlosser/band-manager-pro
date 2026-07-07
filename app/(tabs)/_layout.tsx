import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { useTheme } from "../../src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.acc,
        tabBarInactiveTintColor: colors.sub,
        tabBarStyle: {
          backgroundColor: colors.scheme === "dark" ? "#12121bee" : "#ffffffee",
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
      screenListeners={{
        tabPress: () => Haptics.selectionAsync(),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Overview", tabBarIcon: ({ color }) => <Ionicons name="pie-chart-outline" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: "Events", tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="band"
        options={{ title: "Band", tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="yearly"
        options={{ title: "Yearly", tabBarIcon: ({ color }) => <Ionicons name="repeat-outline" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="report"
        options={{ title: "Report", tabBarIcon: ({ color }) => <Ionicons name="wallet-outline" size={22} color={color} /> }}
      />
    </Tabs>
  );
}
