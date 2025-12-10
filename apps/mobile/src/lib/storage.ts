import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

export const storage = new MMKV({
  id: 'sleek-coach-storage',
});

// Zustand persistence adapter (for non-sensitive data)
export const zustandStorage: StateStorage = {
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name, value) => {
    storage.set(name, value);
  },
  removeItem: (name) => {
    storage.delete(name);
  },
};

// Secure storage for tokens using expo-secure-store (encrypted on device)
export const secureStorage = {
  setToken: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },
  getToken: async (key: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(key);
  },
  deleteToken: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
  hasToken: async (key: string): Promise<boolean> => {
    const value = await SecureStore.getItemAsync(key);
    return value !== null;
  },
};

// Generic storage helpers
export const storageHelpers = {
  set: <T>(key: string, value: T) => {
    storage.set(key, JSON.stringify(value));
  },
  get: <T>(key: string): T | null => {
    const value = storage.getString(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return null;
  },
  remove: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clearAll();
  },
};
