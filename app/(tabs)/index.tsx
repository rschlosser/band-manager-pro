import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { AnimatedNumber, Card, ProgressBar, Row, Screen } from "../../src/components";
import { fmtCHF } from "../../src/domain/format";
import { useOverviewData } from "../../src/hooks/useDerivedData";
import { useStore } from "../../src/store/useStore";
import { useTheme } from "../../src/theme";

export default function OverviewScreen() {
  const { colors, radii, spacing, typography } = useTheme();
  const data = useOverviewData();
  const hydrate = useStore((s) => s.hydrate);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await hydrate();
    setRefreshing(false);
  };

  const progress = data.distributeOverEvents > 0 ? data.eventsHeld / data.distributeOverEvents : 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.acc} />}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xs }}>
          <LinearGradient
            colors={[colors.acc2, colors.pink]}
            style={{ width: 42, height: 42, borderRadius: radii.md, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="musical-notes-outline" size={22} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={{ fontSize: 19, fontWeight: "800", color: colors.txt, letterSpacing: -0.3 }}>Band Manager Pro</Text>
            <Text style={{ fontSize: 12, color: colors.sub }}>Kirtan Singing Circle</Text>
          </View>
        </View>

        <Card
          backgroundColor={colors.scheme === "dark" ? "#1d1435" : "#f3edff"}
          borderColor={colors.scheme === "dark" ? "#3b2a6a" : "#ded0fb"}
        >
          <Text style={{ fontSize: 13, color: colors.sub }}>Total income this year</Text>
          <AnimatedNumber
            value={data.totals.totalIncome}
            formatter={fmtCHF}
            style={{ fontSize: 34, fontWeight: "800", color: colors.txt, letterSpacing: -1, marginVertical: 4 }}
          />
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
            <View style={{ flex: 1, backgroundColor: colors.txt + "10", borderRadius: radii.md, padding: spacing.md }}>
              <Text style={{ fontSize: 11, color: colors.sub }}>Events</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.txt }}>{data.eventsHeld}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.txt + "10", borderRadius: radii.md, padding: spacing.md }}>
              <Text style={{ fontSize: 11, color: colors.sub }}>Members</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.txt }}>{data.membersCount}</Text>
            </View>
          </View>
        </Card>

        <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: radii.full,
              backgroundColor: colors.pink + "22",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="heart-outline" size={22} color={colors.pink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: colors.sub }}>Charity donations (10%)</Text>
            <AnimatedNumber
              value={data.totals.totalDonations}
              formatter={fmtCHF}
              style={{ fontSize: 22, fontWeight: "800", color: colors.pink }}
            />
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.txt, marginBottom: 4 }}>Yearly cost recovery</Text>
          <Row label="Total yearly costs" value={fmtCHF(data.totalYearlyCosts)} numericValue={data.totalYearlyCosts} formatter={fmtCHF} />
          <Row label="Share per event" value={fmtCHF(data.share)} numericValue={data.share} formatter={fmtCHF} />
          <Row label="Events held" value={data.eventsHeld} />
          <Row label="Events remaining to recover" value={data.remaining} color={colors.amber} bold />
          <View style={{ marginTop: spacing.sm }}>
            <ProgressBar progress={progress} />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
