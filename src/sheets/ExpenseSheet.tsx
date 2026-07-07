import React, { useState } from "react";
import { PrimaryButton, SelectField, Sheet, TextField } from "../components";
import { EXPENSE_CATEGORIES } from "../domain/constants";
import { fmtCHF } from "../domain/format";
import { ExpenseCategory } from "../domain/types";
import { useStore } from "../store/useStore";

export function ExpenseSheet({ visible, onClose, eventId }: { visible: boolean; onClose: () => void; eventId: string }) {
  const addExpense = useStore((s) => s.addExpense);
  const [category, setCategory] = useState<ExpenseCategory>("Venue rental");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const reset = () => {
    setCategory("Venue rental");
    setDescription("");
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
    addExpense(eventId, { category, description: category === "Other" ? description.trim() : "", amount: parsed });
    reset();
    onClose();
  };

  return (
    <Sheet visible={visible} title="Add expense" onClose={handleClose}>
      <SelectField
        label="CATEGORY"
        value={category}
        onChange={(v) => setCategory(v as ExpenseCategory)}
        options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
      />
      {category === "Other" && (
        <TextField label="DESCRIPTION" placeholder="What was it for?" value={description} onChangeText={setDescription} />
      )}
      <TextField label="AMOUNT (CHF)" placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      <PrimaryButton title={valid ? `Add ${fmtCHF(parsed)}` : "Add expense"} onPress={handleSubmit} disabled={!valid} />
    </Sheet>
  );
}
