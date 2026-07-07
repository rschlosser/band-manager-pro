import React, { useState } from "react";
import { PrimaryButton, SelectField, Sheet, TextField } from "../components";
import { ADMIN_HOURLY_RATE, ADMIN_WORK_TYPES } from "../domain/constants";
import { fmtCHF } from "../domain/format";
import { AdminWorkType } from "../domain/types";
import { useStore } from "../store/useStore";

export function AdminSheet({ visible, onClose, eventId }: { visible: boolean; onClose: () => void; eventId: string }) {
  const members = useStore((s) => s.members);
  const addAdminItem = useStore((s) => s.addAdminItem);
  const [memberId, setMemberId] = useState("");
  const [type, setType] = useState<AdminWorkType>("Marketing");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setMemberId("");
    setType("Marketing");
    setHours("");
    setDescription("");
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const parsedHours = parseFloat(hours);
  const valid = !!memberId && !Number.isNaN(parsedHours) && parsedHours > 0;

  const handleSubmit = () => {
    if (!valid) return;
    addAdminItem(eventId, { memberId, type, hours: parsedHours, description: description.trim() });
    reset();
    onClose();
  };

  return (
    <Sheet visible={visible} title="Add admin work" onClose={handleClose}>
      <SelectField
        label="MEMBER"
        value={memberId}
        placeholder="Select member…"
        onChange={setMemberId}
        options={members.map((m) => ({ value: m.id, label: m.name }))}
      />
      <SelectField
        label="TYPE"
        value={type}
        onChange={(v) => setType(v as AdminWorkType)}
        options={ADMIN_WORK_TYPES.map((t) => ({ value: t, label: t }))}
      />
      <TextField label="HOURS" placeholder="0" keyboardType="decimal-pad" value={hours} onChangeText={setHours} />
      <TextField label="DESCRIPTION (OPTIONAL)" placeholder="Details…" value={description} onChangeText={setDescription} />
      <PrimaryButton
        title={`Add (${fmtCHF((Number.isNaN(parsedHours) ? 0 : parsedHours) * ADMIN_HOURLY_RATE)})`}
        onPress={handleSubmit}
        disabled={!valid}
      />
    </Sheet>
  );
}
