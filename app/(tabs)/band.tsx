import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { Card, CloudSyncCard, EmptyState, IconButton, Screen, SwipeableRow } from "../../src/components";
import { isSupabaseConfigured } from "../../src/lib/supabase";
import { useStore } from "../../src/store/useStore";
import { useTheme } from "../../src/theme";

export default function BandScreen() {
  const { colors, radii, spacing, typography } = useTheme();
  const members = useStore((s) => s.members);
  const addMember = useStore((s) => s.addMember);
  const deleteMember = useStore((s) => s.deleteMember);
  const hydrate = useStore((s) => s.hydrate);

  const [name, setName] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    addMember(name);
    setName("");
  };

  const confirmDelete = (id: string, memberName: string) => {
    Alert.alert(`Remove ${memberName}?`, "This member will no longer appear in new events.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteMember(id) },
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
        <Text style={{ ...typography.title, color: colors.txt }}>Band members</Text>

        {isSupabaseConfigured && <CloudSyncCard />}

        <Card>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TextInput
              placeholder="Name"
              placeholderTextColor={colors.sub}
              value={name}
              onChangeText={setName}
              onSubmitEditing={submit}
              returnKeyType="done"
              style={{
                flex: 1,
                backgroundColor: colors.card2,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md + 2,
                paddingVertical: spacing.md,
                color: colors.txt,
                fontSize: 15,
              }}
            />
            <IconButton icon="add" onPress={submit} size={52} />
          </View>
        </Card>

        {members.length === 0 && <EmptyState icon="people-outline" text="Add your band members" />}

        {members.map((m) => (
          <Animated.View key={m.id} entering={FadeInDown.springify().damping(16)} exiting={FadeOutUp} layout={LinearTransition}>
            <SwipeableRow onDelete={() => confirmDelete(m.id, m.name)}>
              <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 13 }}>
                <LinearGradient
                  colors={[colors.acc2, colors.pink]}
                  style={{ width: 38, height: 38, borderRadius: radii.full, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{m.name[0]?.toUpperCase()}</Text>
                </LinearGradient>
                <Text style={{ flex: 1, fontWeight: "600", fontSize: 15, color: colors.txt }}>{m.name}</Text>
              </Card>
            </SwipeableRow>
          </Animated.View>
        ))}
      </ScrollView>
    </Screen>
  );
}
