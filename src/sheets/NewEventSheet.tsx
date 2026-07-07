import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { Chip, PrimaryButton, Sheet, TextField } from "../components";
import { todayISO } from "../domain/format";
import { useStore } from "../store/useStore";
import { useTheme } from "../theme";

export function NewEventSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, typography, spacing } = useTheme();
  const members = useStore((s) => s.members);
  const addEvent = useStore((s) => s.addEvent);
  const router = useRouter();

  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [selected, setSelected] = useState<string[]>([]);

  const reset = () => {
    setName("");
    setDate(todayISO());
    setSelected([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = addEvent({ name, date, memberIds: selected });
    reset();
    onClose();
    router.push(`/event/${id}`);
  };

  return (
    <Sheet visible={visible} title="New event" onClose={handleClose}>
      <TextField label="EVENT NAME" placeholder="Kirtan Singing Circle" value={name} onChangeText={setName} />
      <TextField label="DATE" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} autoCapitalize="none" />
      <Text style={{ ...typography.label, color: colors.sub, marginBottom: spacing.xs + 2 }}>PARTICIPATING MEMBERS</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg }}>
        {members.length === 0 && <Text style={{ fontSize: 13, color: colors.sub }}>Add members in the Band tab first</Text>}
        {members.map((m) => (
          <Chip
            key={m.id}
            label={m.name}
            active={selected.includes(m.id)}
            onPress={() => setSelected((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))}
          />
        ))}
      </View>
      <PrimaryButton title="Create event" onPress={handleCreate} disabled={!name.trim()} />
    </Sheet>
  );
}
