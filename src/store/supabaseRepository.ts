import { supabase } from "../lib/supabase";
import { AppData } from "../domain/types";
import { DataRepository } from "./repository";

/**
 * Cloud-backed repository for one band, scoped by bandId. Whole-blob upsert —
 * simple last-write-wins (no per-field merge). Fine for a handful of people
 * who rarely edit at the exact same second; true conflict-safe sync would
 * mean moving to per-row realtime writes instead of a single JSON blob.
 */
export function createSupabaseRepository(bandId: string): DataRepository {
  return {
    async load() {
      const { data, error } = await supabase.from("band_data").select("data").eq("band_id", bandId).single();
      if (error) throw error;
      return (data?.data as AppData) ?? null;
    },
    async save(data: AppData) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("band_data")
        .update({ data, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq("band_id", bandId);
      if (error) throw error;
    },
  };
}
