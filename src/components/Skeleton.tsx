import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useTheme } from "../theme";

export function Skeleton({ style }: { style?: ViewStyle }) {
  const { colors, radii } = useTheme();
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(0.7, { duration: 650 }), withTiming(0.35, { duration: 650 })), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[{ backgroundColor: colors.card2, borderRadius: radii.md }, style, animatedStyle]} />;
}
