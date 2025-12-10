import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const storage = new MMKV({
  id: 'sleek-coach-storage',
});

// Zustand persistence adapter
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

// Secure storage for tokens (in production, use expo-secure-store)
export const secureStorage = {
  setToken: (key: string, value: string) => {
    storage.set(key, value);
  },
  getToken: (key: string) => {
    return storage.getString(key);
  },
  deleteToken: (key: string) => {
    storage.delete(key);
  },
  hasToken: (key: string) => {
    return storage.contains(key);
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
