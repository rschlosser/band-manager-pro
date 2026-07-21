import { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { asyncStorageRepository } from "./asyncStorageRepository";
import { createSupabaseRepository } from "./supabaseRepository";
import { useStore } from "./useStore";

export type Band = { id: string; name: string; inviteCode: string };

type AuthStatus = "loading" | "signedOut" | "codeSent" | "needsBand" | "ready";

type AuthState = {
  status: AuthStatus;
  email: string | null;
  session: Session | null;
  band: Band | null;
  error: string | null;

  init: () => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  createBand: (name: string) => Promise<void>;
  joinBand: (inviteCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Back out of code entry to the email step, e.g. to fix a typo'd address. */
  cancelCodeEntry: () => void;
};

async function loadBandForCurrentUser(): Promise<Band | null> {
  const { data, error } = await supabase
    .from("band_members")
    .select("band_id, bands(name, invite_code)")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const bandRow = data.bands as unknown as { name: string; invite_code: string } | null;
  if (!bandRow) return null;
  return { id: data.band_id, name: bandRow.name, inviteCode: bandRow.invite_code };
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: "loading",
  email: null,
  session: null,
  band: null,
  error: null,

  init: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      set({ status: "signedOut", session: null });
      return;
    }
    const band = await loadBandForCurrentUser();
    set({ session, band, status: band ? "ready" : "needsBand" });

    supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) {
        set({ status: "signedOut", session: null, band: null, email: null });
      }
    });
  },

  sendCode: async (email) => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ email, status: "codeSent" });
  },

  verifyCode: async (code) => {
    const email = get().email;
    if (!email) return;
    set({ error: null });
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error || !data.session) {
      set({ error: error?.message ?? "Invalid code" });
      return;
    }
    const band = await loadBandForCurrentUser();
    set({ session: data.session, band, status: band ? "ready" : "needsBand" });
  },

  createBand: async (name) => {
    set({ error: null });
    const { data, error } = await supabase.rpc("create_band", { band_name: name.trim() }).single();
    if (error || !data) {
      set({ error: error?.message ?? "Could not create band" });
      return;
    }
    const row = data as { id: string; name: string; invite_code: string };

    // Carry over this device's existing local data (e.g. from trying the app
    // before signing in) into the freshly created — otherwise empty — band.
    const local = await asyncStorageRepository.load();
    if (local && (local.members.length > 0 || local.events.length > 0 || local.yearly.items.length > 0)) {
      await createSupabaseRepository(row.id).save(local);
    }

    set({ band: { id: row.id, name: row.name, inviteCode: row.invite_code }, status: "ready" });
  },

  joinBand: async (inviteCode) => {
    set({ error: null });
    const { data, error } = await supabase.rpc("join_band_by_code", { code: inviteCode.trim() }).single();
    if (error || !data) {
      set({ error: error?.message ?? "Invalid invite code" });
      return;
    }
    const row = data as { id: string; name: string; invite_code: string };
    set({ band: { id: row.id, name: row.name, inviteCode: row.invite_code }, status: "ready" });
  },

  cancelCodeEntry: () => {
    set({ status: "signedOut", email: null, error: null });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ status: "signedOut", session: null, band: null, email: null });
    // Otherwise the store would keep talking to the band we just left.
    await useStore.getState().hydrate(asyncStorageRepository);
  },
}));
