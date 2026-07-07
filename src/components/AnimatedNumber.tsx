import React, { useEffect, useState } from "react";
import { Text, TextStyle } from "react-native";
import { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";

type AnimatedNumberProps = {
  value: number;
  formatter: (n: number) => string;
  style?: TextStyle;
};

/** Smoothly interpolates a numeric value and renders its formatted text, for balances that change over time. */
export function AnimatedNumber({ value, formatter, style }: AnimatedNumberProps) {
  const sv = useSharedValue(value);
  const [display, setDisplay] = useState(() => formatter(value));

  useEffect(() => {
    sv.value = withTiming(value, { duration: 420 });
  }, [value]);

  useAnimatedReaction(
    () => sv.value,
    (current, previous) => {
      if (previous === null || Math.abs(current - previous) > 0.004) {
        runOnJS(setDisplay)(formatter(current));
      }
    }
  );

  return <Text style={style}>{display}</Text>;
}
