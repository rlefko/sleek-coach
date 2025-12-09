// Manual mock for @/lib/storage
const mockStorageMap = new Map<string, string>();

export const storage = {
  getString: jest.fn((key: string) => mockStorageMap.get(key)),
  set: jest.fn((key: string, value: string) => mockStorageMap.set(key, value)),
  delete: jest.fn((key: string) => mockStorageMap.delete(key)),
  contains: jest.fn((key: string) => mockStorageMap.has(key)),
  clearAll: jest.fn(() => mockStorageMap.clear()),
  getNumber: jest.fn(),
  getBoolean: jest.fn(),
};

export const zustandStorage = {
  getItem: jest.fn((name: string) => mockStorageMap.get(name) ?? null),
  setItem: jest.fn((name: string, value: string) => mockStorageMap.set(name, value)),
  removeItem: jest.fn((name: string) => mockStorageMap.delete(name)),
};

export const secureStorage = {
  setToken: jest.fn((key: string, value: string) => mockStorageMap.set(key, value)),
  getToken: jest.fn((key: string) => mockStorageMap.get(key)),
  deleteToken: jest.fn((key: string) => mockStorageMap.delete(key)),
  hasToken: jest.fn((key: string) => mockStorageMap.has(key)),
};

export const storageHelpers = {
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
};

// Reset function for tests to clear the mock storage
export const __resetMockStorage = () => {
  mockStorageMap.clear();
};
