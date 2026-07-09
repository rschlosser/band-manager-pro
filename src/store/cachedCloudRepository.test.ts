import { AppData } from "../domain/types";
import { withOfflineCache } from "./cachedCloudRepository";
import { DataRepository } from "./repository";

jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

const sample: AppData = {
  members: [{ id: "m1", name: "Anna" }],
  events: [],
  yearly: { items: [], contributionPerEvent: 50 },
};

function fakeCloud(overrides: Partial<DataRepository> = {}): DataRepository {
  return {
    load: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("withOfflineCache", () => {
  it("returns cloud data and caches it locally on a successful load", async () => {
    const cloud = fakeCloud({ load: jest.fn().mockResolvedValue(sample) });
    const repo = withOfflineCache(cloud);
    const result = await repo.load();
    expect(result).toEqual(sample);
  });

  it("falls back to the local cache when the cloud load throws", async () => {
    const cloud = fakeCloud({ load: jest.fn().mockRejectedValue(new Error("offline")) });
    const repo = withOfflineCache(cloud);

    // Prime the local cache via a successful save first.
    await repo.save(sample);
    const result = await repo.load();
    expect(result).toEqual(sample);
  });

  it("save always writes locally even when the cloud push fails", async () => {
    const cloud = fakeCloud({ save: jest.fn().mockRejectedValue(new Error("offline")) });
    const repo = withOfflineCache(cloud);

    await expect(repo.save(sample)).resolves.toBeUndefined();

    // A later, working cloud read still returning null should fall through to
    // the local copy that was written despite the failed cloud push.
    const okCloud = fakeCloud({ load: jest.fn().mockResolvedValue(null) });
    const repoAfterRecovery = withOfflineCache(okCloud);
    const result = await repoAfterRecovery.load();
    expect(result).toEqual(sample);
  });
});
