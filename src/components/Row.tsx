import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import { AnimatedNumber } from "./AnimatedNumber";

type RowProps = {
  label: string;
  value: string | number;
  numericValue?: number;
  formatter?: (n: number) => string;
  color?: string;
  bold?: boolean;
  big?: boolean;
};

/** A label/value line used throughout balance sheets and reports; animates when given a numericValue. */
export function Row({ label, value, numericValue, formatter, color, bold, big }: RowProps) {
  const { colors } = useTheme();
  const fontSize = big ? 17 : 14;
  const fontWeight = bold ? ("700" as const) : ("400" as const);
  const textColor = color ?? colors.txt;

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7 }}>
      <Text style={{ color: colors.sub, fontSize, fontWeight }}>{label}</Text>
      {numericValue !== undefined && formatter ? (
        <AnimatedNumber
          value={numericValue}
          formatter={formatter}
          style={{ color: textColor, fontSize, fontWeight, fontVariant: ["tabular-nums"] }}
        />
      ) : (
        <Text style={{ color: textColor, fontSize, fontWeight, fontVariant: ["tabular-nums"] }}>{value}</Text>
      )}
    </View>
  );
}
