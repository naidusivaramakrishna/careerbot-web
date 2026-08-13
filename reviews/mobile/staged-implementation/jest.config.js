/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: ['<rootDir>/jest.setup.ts'],
  // jest-expo preset already covers most TS + RN config. We add path aliases
  // matching tsconfig.json + the MSW node server setup.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/.expo/',
    '/dist/',
  ],
  // Coverage targets per IMPLEMENTATION_BLUEPRINT_FOR_DEVELOPER.txt Week 3:
  // 80% on src/api and src/features/auth.
  collectCoverageFrom: [
    'src/api/**/*.{ts,tsx}',
    'src/features/auth/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/__mocks__/**',
  ],
};
