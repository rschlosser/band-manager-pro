import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme";

export function EmptyState({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl }}>
      <Ionicons name={icon} size={40} color={colors.sub} style={{ opacity: 0.4, marginBottom: spacing.md }} />
      <Text style={{ fontSize: 14, color: colors.sub, textAlign: "center" }}>{text}</Text>
    </View>
  );
}
