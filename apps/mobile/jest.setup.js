// Jest setup file

// Set React Native globals
global.__DEV__ = true;

// Mock MMKV storage
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock @/lib/storage globally
const mockStorageMap = new Map();
jest.mock('@/lib/storage', () => ({
  storage: {
    getString: jest.fn((key) => mockStorageMap.get(key)),
    set: jest.fn((key, value) => mockStorageMap.set(key, value)),
    delete: jest.fn((key) => mockStorageMap.delete(key)),
    contains: jest.fn((key) => mockStorageMap.has(key)),
    clearAll: jest.fn(() => mockStorageMap.clear()),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
  },
  zustandStorage: {
    getItem: jest.fn((name) => mockStorageMap.get(name) ?? null),
    setItem: jest.fn((name, value) => mockStorageMap.set(name, value)),
    removeItem: jest.fn((name) => mockStorageMap.delete(name)),
  },
  secureStorage: {
    setToken: jest.fn((key, value) => mockStorageMap.set(key, value)),
    getToken: jest.fn((key) => mockStorageMap.get(key)),
    deleteToken: jest.fn((key) => mockStorageMap.delete(key)),
    hasToken: jest.fn((key) => mockStorageMap.has(key)),
  },
  storageHelpers: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  },
}));

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Animated:') ||
      args[0].includes('componentWillReceiveProps') ||
      args[0].includes('componentWillMount'))
  ) {
    return;
  }
  originalWarn(...args);
};
