import React from "react";
import { View } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { BackgroundGlow } from "./BackgroundGlow";

export function Screen({ children, edges = ["top"] }: { children: React.ReactNode; edges?: Edge[] }) {
  return (
    <View style={{ flex: 1 }}>
      <BackgroundGlow />
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}
