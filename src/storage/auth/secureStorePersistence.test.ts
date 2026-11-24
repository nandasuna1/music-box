import { Platform } from "react-native";

import * as SecureStore from "expo-secure-store";
import { secureStoreAsyncStorage } from "./secureStorePersistence";

jest.mock("expo-secure-store", () => {
  const mockStore = new Map<string, string>();
  return {
    __mockStore: mockStore,
    getItemAsync: jest.fn((key: string) =>
      Promise.resolve(mockStore.has(key) ? mockStore.get(key)! : null),
    ),
    setItemAsync: jest.fn((key: string, value: string) => {
      mockStore.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      mockStore.delete(key);
      return Promise.resolve();
    }),
  };
});

const store = (SecureStore as unknown as { __mockStore: Map<string, string> })
  .__mockStore;

describe("secureStoreAsyncStorage", () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    Platform.OS = "ios";
  });

  it("persists a small value via SecureStore using a sanitized key", async () => {
    const key = "firebase:authUser:api-key:[DEFAULT]";
    await secureStoreAsyncStorage.setItem(key, "small-value");

    expect(SecureStore.setItemAsync).toHaveBeenCalled();
    const value = await secureStoreAsyncStorage.getItem(key);
    expect(value).toBe("small-value");
  });

  it("chunks values larger than the SecureStore size limit and reassembles them on read", async () => {
    const key = "firebase:authUser:api-key:[DEFAULT]";
    const largeValue = "a".repeat(5000);

    await secureStoreAsyncStorage.setItem(key, largeValue);
    const result = await secureStoreAsyncStorage.getItem(key);

    expect(result).toBe(largeValue);
    // Ensure it was actually split into multiple SecureStore entries.
    expect(
      (SecureStore.setItemAsync as jest.Mock).mock.calls.length,
    ).toBeGreaterThan(1);
  });

  it("removes all chunks and the chunk-count entry", async () => {
    const key = "firebase:authUser:api-key:[DEFAULT]";
    await secureStoreAsyncStorage.setItem(key, "a".repeat(5000));

    await secureStoreAsyncStorage.removeItem(key);

    expect(await secureStoreAsyncStorage.getItem(key)).toBeNull();
  });

  it("cleans up leftover chunks when a value shrinks", async () => {
    const key = "firebase:authUser:api-key:[DEFAULT]";
    await secureStoreAsyncStorage.setItem(key, "a".repeat(5000));
    await secureStoreAsyncStorage.setItem(key, "small");

    const value = await secureStoreAsyncStorage.getItem(key);
    expect(value).toBe("small");
  });

  it("returns null when there is no stored value", async () => {
    const value = await secureStoreAsyncStorage.getItem("nonexistent-key");
    expect(value).toBeNull();
  });

  it("falls back to AsyncStorage on web", async () => {
    Platform.OS = "web";
    const key = "web-key";

    await secureStoreAsyncStorage.setItem(key, "web-value");
    const value = await secureStoreAsyncStorage.getItem(key);

    expect(value).toBe("web-value");
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();

    await secureStoreAsyncStorage.removeItem(key);
    expect(await secureStoreAsyncStorage.getItem(key)).toBeNull();
  });
});
