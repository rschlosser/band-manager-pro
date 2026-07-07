import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Card, EmptyState, PrimaryButton, Row, Screen } from "../../src/components";
import { reportToCSV } from "../../src/domain/calc";
import { fmtCHF } from "../../src/domain/format";
import { useAnnualReport } from "../../src/hooks/useDerivedData";
import { useStore } from "../../src/store/useStore";
import { useTheme } from "../../src/theme";

export default function ReportScreen() {
  const { colors, spacing, typography } = useTheme();
  const report = useAnnualReport();
  const hydrate = useStore((s) => s.hydrate);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await hydrate();
    setRefreshing(false);
  };

  const exportCSV = async () => {
    try {
      setExporting(true);
      const csv = reportToCSV(report);
      const file = new File(Paths.cache, "annual-report.csv");
      if (file.exists) file.delete();
      file.write(csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "text/csv", dialogTitle: "Annual report" });
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.acc} />}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ ...typography.title, color: colors.txt }}>Annual report</Text>
          <PrimaryButton
            compact
            title="CSV"
            icon="download-outline"
            onPress={exportCSV}
            disabled={exporting || report.rows.length === 0}
          />
        </View>

        <Card
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          backgroundColor={colors.scheme === "dark" ? "#2a1030" : "#fbeef8"}
          borderColor={colors.scheme === "dark" ? "#4a2050" : "#f3d3ec"}
        >
          <Ionicons name="heart" size={26} color={colors.pink} />
          <View>
            <Text style={{ fontSize: 12, color: colors.sub }}>Collected for charity (10%)</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.pink }}>{fmtCHF(report.totalDonations)}</Text>
          </View>
        </Card>

        {report.rows.length === 0 && <EmptyState icon="briefcase-outline" text="Add members and events to see payouts" />}

        {report.rows.map((row) => (
          <Card key={row.memberId}>
            <Text style={{ fontWeight: "700", fontSize: 15, color: colors.txt, marginBottom: 4 }}>{row.name}</Text>
            <Row
              label="Performance payouts"
              value={fmtCHF(row.performancePayouts)}
              numericValue={row.performancePayouts}
              formatter={fmtCHF}
            />
            <Row
              label="Admin work"
              value={fmtCHF(row.adminCompensation)}
              numericValue={row.adminCompensation}
              formatter={fmtCHF}
              color={colors.amber}
            />
            <Row
              label="Cost reimbursement"
              value={fmtCHF(row.yearlyCostReimbursement)}
              numericValue={row.yearlyCostReimbursement}
              formatter={fmtCHF}
            />
            <View style={{ borderTopWidth: 1, borderTopColor: colors.line, marginVertical: 4 }} />
            <Row label="Total payout" value={fmtCHF(row.total)} numericValue={row.total} formatter={fmtCHF} color={colors.green} bold big />
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
