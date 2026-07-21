import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Share, Text, View } from "react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useTheme } from "../theme";
import { Card } from "./Card";

/** Shows the synced band + invite-code share + sign-out. Renders nothing if not signed into a band. */
export function CloudSyncCard() {
  const { colors, radii, spacing } = useTheme();
  const band = useAuthStore((s) => s.band);
  const signOut = useAuthStore((s) => s.signOut);

  if (!band) return null;

  const shareInviteCode = () => {
    Share.share({ message: `Join "${band.name}" on Band Manager Pro — invite code: ${band.inviteCode}` });
  };

  return (
    <Card backgroundColor={colors.scheme === "dark" ? "#14202b" : "#eef6fb"} borderColor={colors.scheme === "dark" ? "#1f3a4a" : "#cfe6f2"}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: colors.sub }}>Synced band</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.txt }}>{band.name}</Text>
          <Text style={{ fontSize: 12, color: colors.sub, marginTop: 2 }}>Invite code: {band.inviteCode}</Text>
        </View>
        <Pressable
          onPress={shareInviteCode}
          style={{ backgroundColor: colors.acc + "22", borderRadius: radii.full, padding: 10, marginRight: spacing.sm }}
        >
          <Ionicons name="share-outline" size={18} color={colors.acc} />
        </Pressable>
        <Pressable onPress={signOut} style={{ backgroundColor: colors.red + "18", borderRadius: radii.full, padding: 10 }}>
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
        </Pressable>
      </View>
    </Card>
  );
}
