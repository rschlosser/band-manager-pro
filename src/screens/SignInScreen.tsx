import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { PrimaryButton, Screen, TextField } from "../components";
import { useAuthStore } from "../store/useAuthStore";
import { useTheme } from "../theme";

export function SignInScreen({ onSkip }: { onSkip: () => void }) {
  const { colors, spacing, typography } = useTheme();
  const status = useAuthStore((s) => s.status);
  const email = useAuthStore((s) => s.email);
  const error = useAuthStore((s) => s.error);
  const sendCode = useAuthStore((s) => s.sendCode);
  const verifyCode = useAuthStore((s) => s.verifyCode);
  const cancelCodeEntry = useAuthStore((s) => s.cancelCodeEntry);

  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [sending, setSending] = useState(false);
  const [resent, setResent] = useState(false);

  const codeSent = status === "codeSent";

  const handleSend = async () => {
    if (!emailInput.trim()) return;
    setSending(true);
    await sendCode(emailInput.trim());
    setSending(false);
  };

  const handleVerify = async () => {
    if (!codeInput.trim()) return;
    setSending(true);
    await verifyCode(codeInput.trim());
    setSending(false);
  };

  const handleResend = async () => {
    if (!email) return;
    setSending(true);
    setResent(false);
    await sendCode(email);
    setSending(false);
    setResent(true);
  };

  const handleChangeEmail = () => {
    setCodeInput("");
    setResent(false);
    cancelCodeEntry();
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ ...typography.title, color: colors.txt, marginBottom: spacing.xs }}>Band Manager Pro</Text>
          <Text style={{ fontSize: 14, color: colors.sub, marginBottom: spacing.lg }}>
            {codeSent
              ? `Enter the code we sent to ${email}. Look for the number in the email — not the "Sign in" link.`
              : "Sign in with your email — no password, just a one-time code."}
          </Text>

          {!codeSent && (
            <>
              <TextField
                label="EMAIL"
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={emailInput}
                onChangeText={setEmailInput}
              />
              <PrimaryButton title="Send code" onPress={handleSend} disabled={sending || !emailInput.trim()} />
            </>
          )}

          {codeSent && (
            <>
              <TextField
                label="CODE FROM THE EMAIL"
                placeholder="12345678"
                keyboardType="number-pad"
                value={codeInput}
                onChangeText={setCodeInput}
              />
              <PrimaryButton title="Verify" onPress={handleVerify} disabled={sending || !codeInput.trim()} />

              <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.lg, marginTop: spacing.md }}>
                <Pressable onPress={handleResend} disabled={sending} hitSlop={8}>
                  <Text style={{ color: colors.acc, fontSize: 13, fontWeight: "600" }}>Resend code</Text>
                </Pressable>
                <Pressable onPress={handleChangeEmail} hitSlop={8}>
                  <Text style={{ color: colors.sub, fontSize: 13 }}>Change email</Text>
                </Pressable>
              </View>
              {resent && !error && (
                <Text style={{ color: colors.green, fontSize: 12, textAlign: "center", marginTop: spacing.xs }}>
                  New code sent to {email}.
                </Text>
              )}
            </>
          )}

          {error && <Text style={{ color: colors.red, fontSize: 13, marginTop: spacing.xs }}>{error}</Text>}

          <View style={{ marginTop: spacing.xl, alignItems: "center" }}>
            <Pressable onPress={onSkip} hitSlop={8}>
              <Text style={{ color: colors.sub, fontSize: 13, textDecorationLine: "underline" }}>
                Skip for now — use this device only
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
