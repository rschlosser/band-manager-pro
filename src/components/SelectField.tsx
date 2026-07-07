import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../theme";

export type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

/** RN has no native <select> — this opens a themed modal list instead. */
export function SelectField({ label, value, placeholder, options, onChange }: SelectFieldProps) {
  const { colors, radii, spacing, typography } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? placeholder ?? "Select…";

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.label, color: colors.sub, marginBottom: spacing.xs + 2 }}>{label}</Text>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(true);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.card2,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md + 2,
          paddingVertical: spacing.md,
        }}
      >
        <Text style={{ color: value ? colors.txt : colors.sub, fontSize: 15 }}>{current}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.sub} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "center", padding: spacing.xl }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              borderWidth: 1,
              borderColor: colors.line,
              overflow: "hidden",
            }}
          >
            {options.map((o, i) => (
              <Pressable
                key={o.value}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  paddingVertical: spacing.md + 2,
                  paddingHorizontal: spacing.lg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.line,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: o.value === value ? colors.acc : colors.txt,
                    fontSize: 15,
                    fontWeight: o.value === value ? "700" : "400",
                  }}
                >
                  {o.label}
                </Text>
                {o.value === value && <Ionicons name="checkmark" size={18} color={colors.acc} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
