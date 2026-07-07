import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../theme";

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, radii, spacing } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md + 2,
        borderRadius: radii.full,
        borderWidth: 1,
        backgroundColor: active ? colors.acc2 : colors.card2,
        borderColor: active ? colors.acc2 : colors.line,
      }}
    >
      <Text style={{ color: active ? "#fff" : colors.sub, fontSize: 13, fontWeight: "500" }}>{label}</Text>
    </Pressable>
  );
}
