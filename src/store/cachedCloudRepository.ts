import { AppData } from "../domain/types";
import { asyncStorageRepository } from "./asyncStorageRepository";
import { DataRepository } from "./repository";

/**
 * Wraps a cloud repository with an AsyncStorage cache: reads prefer the
 * cloud but fall back to the last-synced local copy when offline; writes
 * always land locally first (so nothing is lost mid-flight) and are then
 * best-effort pushed to the cloud.
 */
export function withOfflineCache(cloud: DataRepository): DataRepository {
  return {
    async load() {
      try {
        const remote = await cloud.load();
        if (remote) await asyncStorageRepository.save(remote);
        return remote ?? (await asyncStorageRepository.load());
      } catch {
        return asyncStorageRepository.load();
      }
    },
    async save(data: AppData) {
      await asyncStorageRepository.save(data);
      try {
        await cloud.save(data);
      } catch {
        // Offline or the request failed — the local cache still has this
        // write, and the next successful save/load will reconcile.
      }
    },
  };
}
