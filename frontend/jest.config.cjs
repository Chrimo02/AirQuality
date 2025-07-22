// jest.config.cjs
module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  testEnvironment: 'jest-environment-jsdom',

  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },

  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '^src/(.*)$': '<rootDir>/src/$1'
  },

  setupFiles: ['<rootDir>/jest.setup.cjs'],

  
  setupFilesAfterEnv: ['@testing-library/jest-dom'],

  transformIgnorePatterns: ['/node_modules/']
};
