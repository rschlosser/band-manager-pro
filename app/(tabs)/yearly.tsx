import React, { useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { Card, EmptyState, PrimaryButton, ProgressBar, Row, Screen, SwipeableRow } from "../../src/components";
import { eventsRemainingToRecover, outstandingSharedCosts, totalYearlyCosts } from "../../src/domain/calc";
import { fmtCHF } from "../../src/domain/format";
import { YearlyItemSheet } from "../../src/sheets/YearlyItemSheet";
import { useStore } from "../../src/store/useStore";
import { useTheme } from "../../src/theme";

export default function YearlyScreen() {
  const { colors, radii, spacing, typography } = useTheme();
  const members = useStore((s) => s.members);
  const yearly = useStore((s) => s.yearly);
  const events = useStore((s) => s.events);
  const deleteYearlyItem = useStore((s) => s.deleteYearlyItem);
  const setContributionPerEvent = useStore((s) => s.setContributionPerEvent);
  const hydrate = useStore((s) => s.hydrate);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [contributionInput, setContributionInput] = useState(String(yearly.contributionPerEvent));
  const [refreshing, setRefreshing] = useState(false);

  const total = totalYearlyCosts(yearly);
  const outstanding = outstandingSharedCosts(yearly, events);
  const remaining = eventsRemainingToRecover(yearly, events);
  const progress = total > 0 ? (total - outstanding) / total : 0;

  const commitContribution = () => {
    const amount = parseFloat(contributionInput);
    setContributionPerEvent(Number.isNaN(amount) ? 0 : amount);
  };

  const confirmDelete = (id: string, description: string) => {
    Alert.alert(`Delete "${description}"?`, "This cost item will be removed from the shared cost pot.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteYearlyItem(id) },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await hydrate();
    setRefreshing(false);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.acc} />}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ ...typography.title, color: colors.txt }}>Shared costs</Text>
          <PrimaryButton compact title="New" icon="add" onPress={() => setSheetOpen(true)} />
        </View>

        <Card>
          <Text style={{ ...typography.label, color: colors.sub, marginBottom: spacing.xs + 2 }}>
            CONTRIBUTION PER EVENT (CHF)
          </Text>
          <TextInput
            keyboardType="decimal-pad"
            value={contributionInput}
            onChangeText={setContributionInput}
            onEndEditing={commitContribution}
            onSubmitEditing={commitContribution}
            style={{
              backgroundColor: colors.card2,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md + 2,
              paddingVertical: spacing.md,
              color: colors.txt,
              fontSize: 15,
              marginBottom: spacing.sm,
            }}
          />
          <Row label="Total costs this year" value={fmtCHF(total)} numericValue={total} formatter={fmtCHF} bold />
          <Row label="Still outstanding" value={fmtCHF(outstanding)} numericValue={outstanding} formatter={fmtCHF} color={colors.amber} bold />
          <Row
            label="Events until recovered"
            value={remaining === null ? "—" : remaining}
            color={colors.acc}
          />
          <View style={{ marginTop: spacing.sm }}>
            <ProgressBar progress={progress} />
          </View>
          <Text style={{ fontSize: 12, color: colors.sub, marginTop: spacing.sm }}>
            Every new event pays this fixed amount into the pot until it is settled. Purchases added later simply extend
            the pot — past events never change.
          </Text>
        </Card>

        {yearly.items.length === 0 && <EmptyState icon="repeat-outline" text="No shared cost items yet" />}

        {yearly.items.map((item) => {
          const paidBy = members.find((m) => m.id === item.paidByMemberId)?.name ?? "?";
          return (
            <Animated.View key={item.id} entering={FadeInDown.springify().damping(16)} exiting={FadeOutUp} layout={LinearTransition}>
              <SwipeableRow onDelete={() => confirmDelete(item.id, item.description)}>
                <Card style={{ paddingVertical: 13 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", fontSize: 15, color: colors.txt }}>{item.description}</Text>
                      <Text style={{ fontSize: 12, color: colors.sub, marginTop: 2 }}>
                        {item.invoiceDate} · paid by {paidBy}
                      </Text>
                    </View>
                    <Text style={{ fontWeight: "700", fontSize: 15, color: colors.txt, fontVariant: ["tabular-nums"] }}>
                      {fmtCHF(item.amount)}
                    </Text>
                  </View>
                </Card>
              </SwipeableRow>
            </Animated.View>
          );
        })}
      </ScrollView>

      <YearlyItemSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </Screen>
  );
}
