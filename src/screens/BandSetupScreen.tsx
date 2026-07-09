import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Card, PrimaryButton, Screen, TextField } from "../components";
import { useAuthStore } from "../store/useAuthStore";
import { useTheme } from "../theme";

export function BandSetupScreen() {
  const { colors, spacing, typography } = useTheme();
  const error = useAuthStore((s) => s.error);
  const createBand = useAuthStore((s) => s.createBand);
  const joinBand = useAuthStore((s) => s.joinBand);
  const signOut = useAuthStore((s) => s.signOut);

  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await createBand(name.trim());
    setBusy(false);
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    setBusy(true);
    await joinBand(code.trim());
    setBusy(false);
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ ...typography.title, color: colors.txt, marginBottom: spacing.xs }}>Your band</Text>
          <Text style={{ fontSize: 14, color: colors.sub, marginBottom: spacing.lg }}>
            Create a new shared band, or join one with an invite code from a bandmate.
          </Text>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
            <Pressable
              onPress={() => setMode("create")}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: 999,
                alignItems: "center",
                backgroundColor: mode === "create" ? colors.acc2 : colors.card2,
              }}
            >
              <Text style={{ color: mode === "create" ? "#fff" : colors.sub, fontWeight: "600" }}>Create</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("join")}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: 999,
                alignItems: "center",
                backgroundColor: mode === "join" ? colors.acc2 : colors.card2,
              }}
            >
              <Text style={{ color: mode === "join" ? "#fff" : colors.sub, fontWeight: "600" }}>Join</Text>
            </Pressable>
          </View>

          <Card>
            {mode === "create" ? (
              <>
                <TextField label="BAND NAME" placeholder="Kirtan Singing Circle" value={name} onChangeText={setName} />
                <PrimaryButton title="Create band" onPress={handleCreate} disabled={busy || !name.trim()} />
              </>
            ) : (
              <>
                <TextField
                  label="INVITE CODE"
                  placeholder="e.g. a1b2c3d4"
                  autoCapitalize="none"
                  value={code}
                  onChangeText={setCode}
                />
                <PrimaryButton title="Join band" onPress={handleJoin} disabled={busy || !code.trim()} />
              </>
            )}
          </Card>

          {error && <Text style={{ color: colors.red, fontSize: 13, marginTop: spacing.sm }}>{error}</Text>}

          <View style={{ marginTop: spacing.xl, alignItems: "center" }}>
            <Pressable onPress={signOut} hitSlop={8}>
              <Text style={{ color: colors.sub, fontSize: 13, textDecorationLine: "underline" }}>Sign out</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
