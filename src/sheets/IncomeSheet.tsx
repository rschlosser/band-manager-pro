import React, { useState } from "react";
import { PrimaryButton, SelectField, Sheet, TextField } from "../components";
import { INCOME_SOURCES } from "../domain/constants";
import { fmtCHF } from "../domain/format";
import { IncomeSource } from "../domain/types";
import { useStore } from "../store/useStore";

export function IncomeSheet({ visible, onClose, eventId }: { visible: boolean; onClose: () => void; eventId: string }) {
  const addIncome = useStore((s) => s.addIncome);
  const [source, setSource] = useState<IncomeSource>("Twint direct");
  const [amount, setAmount] = useState("");

  const reset = () => {
    setSource("Twint direct");
    setAmount("");
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const parsed = parseFloat(amount);
  const valid = !Number.isNaN(parsed) && parsed > 0;

  const handleSubmit = () => {
    if (!valid) return;
    addIncome(eventId, { source, amount: parsed });
    reset();
    onClose();
  };

  return (
    <Sheet visible={visible} title="Add income" onClose={handleClose}>
      <SelectField
        label="SOURCE"
        value={source}
        onChange={(v) => setSource(v as IncomeSource)}
        options={INCOME_SOURCES.map((s) => ({ value: s, label: s }))}
      />
      <TextField label="AMOUNT (CHF)" placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      <PrimaryButton title={valid ? `Add ${fmtCHF(parsed)}` : "Add income"} onPress={handleSubmit} disabled={!valid} />
    </Sheet>
  );
}
