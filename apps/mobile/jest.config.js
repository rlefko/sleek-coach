/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|victory-native|react-native-paper|react-native-vector-icons|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@tanstack/react-query|zustand|react-native-marked|marked|@jsamr/.*|html-entities|react-native-reanimated-table|github-slugger|svg-parser)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    // Global thresholds - starting low, will increase as coverage improves
    global: {
      branches: 5,
      functions: 4,
      lines: 8,
      statements: 8,
    },
    // Store coverage - high priority, well tested
    './src/stores/**/*.ts': {
      branches: 50,
      functions: 85,
      lines: 70,
      statements: 70,
    },
    // Schema coverage - pure functions, fully tested
    './src/schemas/**/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleNameMapper: {
    // Mock storage - handle both aliased and relative paths
    '^@/lib/storage$': '<rootDir>/src/lib/__mocks__/storage.ts',
    '^(\\.\\./)+lib/storage$': '<rootDir>/src/lib/__mocks__/storage.ts',
    '^\\./lib/storage$': '<rootDir>/src/lib/__mocks__/storage.ts',
    // General path alias
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Support npm workspaces - look for node_modules in parent directories
  modulePaths: ['<rootDir>', '<rootDir>/../../node_modules'],
  roots: ['<rootDir>/src'],
};
