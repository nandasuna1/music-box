import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ReactNativeAsyncStorage } from "firebase/auth";
import { logger } from "@/utils/logger";

/**
 * `expo-secure-store` limits values to 2048 bytes and only allows keys made of
 * alphanumeric characters, `.`, `-` and `_`. Firebase's persisted auth blobs
 * (e.g. keys like `firebase:authUser:<apiKey>:[DEFAULT]`) violate both
 * constraints, so keys are sanitized and large values are split into chunks.
 */
const CHUNK_SIZE = 2000;
const COUNT_SUFFIX = "__chunks";

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function chunkKey(sanitizedKey: string, index: number): string {
  return `${sanitizedKey}__${index}`;
}

async function removeChunks(
  sanitizedKey: string,
  count: number,
): Promise<void> {
  await Promise.all(
    Array.from({ length: count }, (_, index) =>
      SecureStore.deleteItemAsync(chunkKey(sanitizedKey, index)).catch(
        () => undefined,
      ),
    ),
  );
}

/**
 * A storage adapter that persists Firebase Auth session data (including the
 * refresh token) in the platform's secure hardware-backed storage
 * (Keychain on iOS, Keystore-backed EncryptedSharedPreferences on Android)
 * via `expo-secure-store`, instead of plain-text `AsyncStorage`.
 *
 * SecureStore is unavailable on web, so this adapter transparently falls
 * back to `AsyncStorage` when running on `Platform.OS === "web"`.
 */
export const secureStoreAsyncStorage: ReactNativeAsyncStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, value);
      return;
    }

    const sanitizedKey = sanitizeKey(key);
    const previousCountRaw = await SecureStore.getItemAsync(
      `${sanitizedKey}${COUNT_SUFFIX}`,
    );
    const previousCount = previousCountRaw ? parseInt(previousCountRaw, 10) : 0;

    const chunks: string[] = [];
    for (let offset = 0; offset < value.length; offset += CHUNK_SIZE) {
      chunks.push(value.slice(offset, offset + CHUNK_SIZE));
    }

    try {
      await Promise.all(
        chunks.map((chunk, index) =>
          SecureStore.setItemAsync(chunkKey(sanitizedKey, index), chunk),
        ),
      );
      await SecureStore.setItemAsync(
        `${sanitizedKey}${COUNT_SUFFIX}`,
        String(chunks.length),
      );

      if (previousCount > chunks.length) {
        // Drop any leftover chunks from a previous, larger value.
        await Promise.all(
          Array.from({ length: previousCount - chunks.length }, (_, offset) =>
            SecureStore.deleteItemAsync(
              chunkKey(sanitizedKey, chunks.length + offset),
            ).catch(() => undefined),
          ),
        );
      }
    } catch (error) {
      logger.warn(
        "secureStoreAsyncStorage: failed to persist auth session securely",
        { error },
      );
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(key);
    }

    const sanitizedKey = sanitizeKey(key);
    const countRaw = await SecureStore.getItemAsync(
      `${sanitizedKey}${COUNT_SUFFIX}`,
    );
    if (!countRaw) {
      return null;
    }

    const count = parseInt(countRaw, 10);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.getItemAsync(chunkKey(sanitizedKey, index)),
      ),
    );

    if (chunks.some((chunk) => chunk === null)) {
      return null;
    }

    return chunks.join("");
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
      return;
    }

    const sanitizedKey = sanitizeKey(key);
    const countRaw = await SecureStore.getItemAsync(
      `${sanitizedKey}${COUNT_SUFFIX}`,
    );
    const count = countRaw ? parseInt(countRaw, 10) : 0;

    await removeChunks(sanitizedKey, count);
    await SecureStore.deleteItemAsync(`${sanitizedKey}${COUNT_SUFFIX}`);
  },
};
