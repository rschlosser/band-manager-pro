import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEY } from "../domain/constants";
import { AppData } from "../domain/types";
import { DataRepository } from "./repository";

export const asyncStorageRepository: DataRepository = {
  async load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppData) : null;
    } catch {
      return null;
    }
  },
  async save(data) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Best-effort persistence — a failed write (e.g. storage full) shouldn't crash the app.
    }
  },
};
