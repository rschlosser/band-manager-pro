import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "../theme";

/** Deep background with a soft radial glow anchored near the top, matching the premium dark theme. */
export function BackgroundGlow() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const glowHeight = 560;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none">
      <Svg width={width} height={glowHeight} style={{ position: "absolute", top: 0, left: 0 }}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="0%" r="75%">
            <Stop offset="0%" stopColor={colors.bgGlow} stopOpacity={colors.scheme === "dark" ? 0.5 : 0.28} />
            <Stop offset="100%" stopColor={colors.bgGlow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={glowHeight} fill="url(#glow)" />
      </Svg>
    </View>
  );
}
