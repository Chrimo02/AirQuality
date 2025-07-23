// gruppe-04---air-quality-monitoring/frontend/src/utils/envShim.js
let cachedEnv = null;

export function getViteEnv() {
  if (cachedEnv) return cachedEnv;

  // 1. Jest / Tests: jest.setup.js setzt globalThis.__TEST_ENV__
  if (typeof globalThis !== 'undefined' && globalThis.__TEST_ENV__) {
    cachedEnv = globalThis.__TEST_ENV__;
    return cachedEnv;
  }

  // 2. Node / Fallback
  const useMock =
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.VITE_USE_MOCK) ||
    'true';

  const apiUrl =
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.VITE_API_URL) ||
    'http://localhost:8000';

  cachedEnv = {
    VITE_USE_MOCK: useMock,
    VITE_API_URL: apiUrl
  };
  return cachedEnv;
}
