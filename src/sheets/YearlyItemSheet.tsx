import React, { useState } from "react";
import { PrimaryButton, SelectField, Sheet, TextField } from "../components";
import { fmtCHF, todayISO } from "../domain/format";
import { useStore } from "../store/useStore";

export function YearlyItemSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const members = useStore((s) => s.members);
  const addYearlyItem = useStore((s) => s.addYearlyItem);
  const [description, setDescription] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [paidBy, setPaidBy] = useState("");
  const [amount, setAmount] = useState("");

  const reset = () => {
    setDescription("");
    setInvoiceDate(todayISO());
    setPaidBy("");
    setAmount("");
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const parsed = parseFloat(amount);
  const valid = !!description.trim() && !!paidBy && !Number.isNaN(parsed) && parsed > 0;

  const handleSubmit = () => {
    if (!valid) return;
    addYearlyItem({ description: description.trim(), invoiceDate, paidByMemberId: paidBy, amount: parsed });
    reset();
    onClose();
  };

  return (
    <Sheet visible={visible} title="New yearly cost" onClose={handleClose}>
      <TextField label="DESCRIPTION" placeholder="e.g. Harmonium maintenance" value={description} onChangeText={setDescription} />
      <TextField label="INVOICE DATE" placeholder="YYYY-MM-DD" value={invoiceDate} onChangeText={setInvoiceDate} autoCapitalize="none" />
      <SelectField
        label="PAID BY (GETS REIMBURSED)"
        value={paidBy}
        placeholder="Select member…"
        onChange={setPaidBy}
        options={members.map((m) => ({ value: m.id, label: m.name }))}
      />
      <TextField label="AMOUNT (CHF)" placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      <PrimaryButton title={valid ? `Add ${fmtCHF(parsed)}` : "Add cost item"} onPress={handleSubmit} disabled={!valid} />
    </Sheet>
  );
}
