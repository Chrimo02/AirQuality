// src/utils/envShim.js
// Vereinheitlichter Zugriff auf ENV ohne import.meta (test-sicher)

let cachedEnv = null;

export function getViteEnv() {
  if (cachedEnv) return cachedEnv;

  // 1. Jest / Tests: jest.setup.js setzt globalThis.__TEST_ENV__
  if (typeof globalThis !== 'undefined' && globalThis.__TEST_ENV__) {
    cachedEnv = globalThis.__TEST_ENV__;
    return cachedEnv;
  }

  // 2. Node / Fallback (auch im Vite Dev Server verfügbar, weil wir kein import.meta verwenden)
  const useMock =
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.VITE_USE_MOCK) ||
    'true';s

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
