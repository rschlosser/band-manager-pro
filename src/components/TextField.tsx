import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "../theme";

type TextFieldProps = TextInputProps & { label: string };

export function TextField({ label, style, ...props }: TextFieldProps) {
  const { colors, radii, spacing, typography } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.label, color: colors.sub, marginBottom: spacing.xs + 2 }}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.sub}
        style={[
          {
            backgroundColor: colors.card2,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md + 2,
            paddingVertical: spacing.md,
            color: colors.txt,
            fontSize: 15,
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
}
