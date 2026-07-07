import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleProp, Text, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useTheme } from "../theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PrimaryButtonProps = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  compact?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ title, icon, onPress, compact, disabled, style }: PrimaryButtonProps) {
  const { colors, radii, spacing } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 220 });
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[animatedStyle, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      <LinearGradient
        colors={[colors.acc2, colors.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          borderRadius: radii.lg,
          paddingVertical: compact ? 10 : 13,
          paddingHorizontal: compact ? spacing.md + 2 : spacing.lg,
        }}
      >
        {icon && <Ionicons name={icon} size={17} color="#fff" />}
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>{title}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: "neutral" | "danger";
  size?: number;
};

export function IconButton({ icon, onPress, tone = "neutral", size = 36 }: IconButtonProps) {
  const { colors, radii } = useTheme();
  const bg = tone === "danger" ? colors.red + "18" : colors.card2;
  const fg = tone === "danger" ? colors.red : colors.sub;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={8}
      style={{
        width: size,
        height: size,
        borderRadius: radii.full,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={fg} />
    </Pressable>
  );
}
