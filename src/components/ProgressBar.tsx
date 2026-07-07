import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "../theme";

export function ProgressBar({ progress }: { progress: number }) {
  const { colors, radii } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const sv = useSharedValue(clamped);

  useEffect(() => {
    sv.value = withTiming(clamped, { duration: 500 });
  }, [clamped]);

  const style = useAnimatedStyle(() => ({ width: `${sv.value * 100}%` }));

  return (
    <View style={{ height: 8, backgroundColor: colors.card2, borderRadius: radii.full, overflow: "hidden" }}>
      <Animated.View style={[{ height: "100%", borderRadius: radii.full, overflow: "hidden" }, style]}>
        <LinearGradient colors={[colors.acc2, colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}
