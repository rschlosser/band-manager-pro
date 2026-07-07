import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "../theme";

type CardProps = ViewProps & { borderColor?: string; backgroundColor?: string };

export function Card({ style, borderColor, backgroundColor, ...props }: CardProps) {
  const { colors, radii, spacing } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: backgroundColor ?? colors.card,
          borderWidth: 1,
          borderColor: borderColor ?? colors.line,
          borderRadius: radii.xl,
          padding: spacing.lg,
        },
        style,
      ]}
      {...props}
    />
  );
}
