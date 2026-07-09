import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { Card, Chip, IconButton, Row, Screen, SwipeableRow } from "../../src/components";
import { ADMIN_HOURLY_RATE } from "../../src/domain/constants";
import { fmtCHF } from "../../src/domain/format";
import { useEventBalance } from "../../src/hooks/useDerivedData";
import { AdminSheet } from "../../src/sheets/AdminSheet";
import { ExpenseSheet } from "../../src/sheets/ExpenseSheet";
import { IncomeSheet } from "../../src/sheets/IncomeSheet";
import { useStore } from "../../src/store/useStore";
import { useTheme } from "../../src/theme";

type SheetKind = "income" | "expense" | "admin" | null;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();

  const members = useStore((s) => s.members);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const toggleEventMember = useStore((s) => s.toggleEventMember);
  const deleteIncome = useStore((s) => s.deleteIncome);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const deleteAdminItem = useStore((s) => s.deleteAdminItem);

  const data = useEventBalance(id ?? null);
  const [sheet, setSheet] = useState<SheetKind>(null);

  if (!data) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.sub }}>Event not found.</Text>
        </View>
      </Screen>
    );
  }

  const { event, balance } = data;

  const confirmDeleteEvent = () => {
    Alert.alert(`Delete "${event.name}"?`, "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteEvent(event.id);
          router.back();
        },
      },
    ]);
  };

  const confirmDeleteItem = (description: string, onConfirm: () => void) => {
    Alert.alert(`Delete ${description}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onConfirm },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140, gap: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <IconButton icon="chevron-back" onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.subtitle, color: colors.txt }} numberOfLines={1}>
              {event.name}
            </Text>
            <Text style={{ fontSize: 12, color: colors.sub }}>{event.date || "no date"}</Text>
          </View>
          <IconButton icon="trash-outline" tone="danger" onPress={confirmDeleteEvent} />
        </View>

        <Card
          backgroundColor={colors.scheme === "dark" ? "#14202b" : "#eef6fb"}
          borderColor={colors.scheme === "dark" ? "#1f3a4a" : "#cfe6f2"}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.txt, marginBottom: 4 }}>Balance sheet</Text>
          <Row label="Income" value={"+" + fmtCHF(balance.income)} numericValue={balance.income} formatter={(n) => "+" + fmtCHF(n)} color={colors.green} />
          <Row
            label="Expenses"
            value={"−" + fmtCHF(balance.expenses)}
            numericValue={balance.expenses}
            formatter={(n) => "−" + fmtCHF(n)}
            color={colors.red}
          />
          <Row
            label="Shared cost pot"
            value={"−" + fmtCHF(balance.costContribution)}
            numericValue={balance.costContribution}
            formatter={(n) => "−" + fmtCHF(n)}
            color={colors.red}
          />
          <View style={{ borderTopWidth: 1, borderTopColor: colors.line, marginVertical: 4 }} />
          <Row label="Subtotal" value={fmtCHF(balance.subtotal)} numericValue={balance.subtotal} formatter={fmtCHF} bold />
          <Row
            label="Donation 10%"
            value={"−" + fmtCHF(balance.donation)}
            numericValue={balance.donation}
            formatter={(n) => "−" + fmtCHF(n)}
            color={colors.pink}
          />
          <Row
            label="Admin work"
            value={"−" + fmtCHF(balance.adminCompensation)}
            numericValue={balance.adminCompensation}
            formatter={(n) => "−" + fmtCHF(n)}
            color={colors.amber}
          />
          <View style={{ borderTopWidth: 1, borderTopColor: colors.line, marginVertical: 4 }} />
          <Row
            label="Net payout"
            value={fmtCHF(balance.netPayout)}
            numericValue={balance.netPayout}
            formatter={fmtCHF}
            color={balance.netPayout >= 0 ? colors.green : colors.red}
            bold
            big
          />
          <Row
            label={`Per member (${balance.participantCount})`}
            value={fmtCHF(balance.payoutPerMember)}
            numericValue={balance.payoutPerMember}
            formatter={fmtCHF}
            color={colors.acc}
            bold
          />
        </Card>

        <ItemSection
          title="Income"
          color={colors.green}
          buttonLabel="Add income"
          onAdd={() => setSheet("income")}
          items={event.incomes}
          renderRow={(i) => (
            <>
              <Text style={{ color: colors.txt, fontSize: 14 }}>{i.source}</Text>
              <Text style={{ color: colors.green, fontSize: 14, fontVariant: ["tabular-nums"] }}>+{fmtCHF(i.amount)}</Text>
            </>
          )}
          onDelete={(i) => confirmDeleteItem("this income entry", () => deleteIncome(event.id, i.id))}
        />

        <ItemSection
          title="Expenses"
          color={colors.red}
          buttonLabel="Add expense"
          onAdd={() => setSheet("expense")}
          items={event.expenses}
          renderRow={(x) => (
            <>
              <Text style={{ color: colors.txt, fontSize: 14, flexShrink: 1 }}>
                {x.category}
                {x.description ? ` · ${x.description}` : ""}
              </Text>
              <Text style={{ color: colors.red, fontSize: 14, fontVariant: ["tabular-nums"] }}>−{fmtCHF(x.amount)}</Text>
            </>
          )}
          onDelete={(x) => confirmDeleteItem("this expense", () => deleteExpense(event.id, x.id))}
        />

        <ItemSection
          title={`Admin work (CHF ${ADMIN_HOURLY_RATE}/h)`}
          color={colors.amber}
          buttonLabel="Add admin item"
          onAdd={() => setSheet("admin")}
          items={event.adminItems}
          renderRow={(a) => {
            const memberName = members.find((m) => m.id === a.memberId)?.name ?? "?";
            return (
              <>
                <Text style={{ color: colors.txt, fontSize: 14, flexShrink: 1 }}>
                  {memberName} · {a.type} · {a.hours}h{a.description ? ` · ${a.description}` : ""}
                </Text>
                <Text style={{ color: colors.amber, fontSize: 14, fontVariant: ["tabular-nums"] }}>
                  {fmtCHF(a.hours * ADMIN_HOURLY_RATE)}
                </Text>
              </>
            );
          }}
          onDelete={(a) => confirmDeleteItem("this admin work item", () => deleteAdminItem(event.id, a.id))}
        />

        <Card>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.txt, marginBottom: spacing.md }}>Participating members</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {members.length === 0 && <Text style={{ color: colors.sub, fontSize: 13 }}>Add members in the Band tab first</Text>}
            {members.map((m) => (
              <Chip
                key={m.id}
                label={m.name}
                active={event.memberIds.includes(m.id)}
                onPress={() => toggleEventMember(event.id, m.id)}
              />
            ))}
          </View>
        </Card>
      </ScrollView>

      <IncomeSheet visible={sheet === "income"} onClose={() => setSheet(null)} eventId={event.id} />
      <ExpenseSheet visible={sheet === "expense"} onClose={() => setSheet(null)} eventId={event.id} />
      <AdminSheet visible={sheet === "admin"} onClose={() => setSheet(null)} eventId={event.id} />
    </Screen>
  );
}

function ItemSection<T extends { id: string }>({
  title,
  color,
  buttonLabel,
  onAdd,
  items,
  renderRow,
  onDelete,
}: {
  title: string;
  color: string;
  buttonLabel: string;
  onAdd: () => void;
  items: T[];
  renderRow: (item: T) => React.ReactNode;
  onDelete: (item: T) => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.txt }}>{title}</Text>
        <Pressable
          onPress={onAdd}
          style={{
            backgroundColor: color + "18",
            borderRadius: 999,
            paddingVertical: 6,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Ionicons name="add" size={14} color={color} />
          <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{buttonLabel}</Text>
        </Pressable>
      </View>
      {items.length === 0 && <Text style={{ fontSize: 13, color: colors.sub, paddingVertical: 6 }}>Nothing yet</Text>}
      {items.map((item) => (
        <Animated.View key={item.id} entering={FadeInDown} exiting={FadeOutUp} layout={LinearTransition}>
          <SwipeableRow onDelete={() => onDelete(item)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.sm,
                paddingVertical: 9,
                borderTopWidth: 1,
                borderTopColor: colors.line,
              }}
            >
              {renderRow(item)}
            </View>
          </SwipeableRow>
        </Animated.View>
      ))}
    </Card>
  );
}
