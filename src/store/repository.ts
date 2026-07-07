import { AppData } from "../domain/types";

/**
 * Storage is abstracted behind this interface so v1's offline-only AsyncStorage
 * implementation can later be swapped for a cloud-sync backed one without
 * touching the store or any screen.
 */
export interface DataRepository {
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
}
