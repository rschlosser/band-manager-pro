import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { Card, EmptyState, PrimaryButton, Screen } from "../../src/components";
import { calcEventBalance } from "../../src/domain/calc";
import { fmtCHF } from "../../src/domain/format";
import { NewEventSheet } from "../../src/sheets/NewEventSheet";
import { useStore } from "../../src/store/useStore";
import { useTheme } from "../../src/theme";

export default function EventsScreen() {
  const { colors, radii, spacing, typography } = useTheme();
  const events = useStore((s) => s.events);
  const hydrate = useStore((s) => s.hydrate);
  const router = useRouter();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const sorted = [...events].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

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
          <Text style={{ ...typography.title, color: colors.txt }}>Events</Text>
          <PrimaryButton compact title="New" icon="add" onPress={() => setSheetOpen(true)} />
        </View>

        {sorted.length === 0 && <EmptyState icon="calendar-outline" text="No events yet. Create your first Kirtan event." />}

        {sorted.map((event) => {
          const balance = calcEventBalance(event);
          return (
            <Animated.View key={event.id} entering={FadeInDown.springify().damping(16)} exiting={FadeOutUp} layout={LinearTransition}>
              <Pressable onPress={() => router.push(`/event/${event.id}`)}>
                <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radii.md,
                      backgroundColor: colors.card2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {event.date ? (
                      <>
                        <Text style={{ fontSize: 11, color: colors.acc, fontWeight: "700" }}>{event.date.slice(8, 10)}</Text>
                        <Text style={{ fontSize: 9, color: colors.sub }}>
                          {event.date.slice(5, 7)}/{event.date.slice(2, 4)}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ color: colors.sub }}>—</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontWeight: "600", fontSize: 15, color: colors.txt }}>
                      {event.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.sub }}>
                      {event.memberIds.length} members · Net {fmtCHF(balance.netPayout)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.sub} />
                </Card>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      <NewEventSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </Screen>
  );
}
