// jest.setup.js
import '@testing-library/jest-dom';

/* ---------------------------------------------------------
 * 1. Vite-ähnliche ENV für Tests bereitstellen
 * --------------------------------------------------------- */
const testEnv = {
  VITE_USE_MOCK: 'true',
  VITE_API_URL: 'http://localhost:8000'
};

// Falls import.meta existiert (bei ESM in Jest), erweitern –
// sonst definieren wir ein Dummy-Objekt.
try {
  if (typeof import.meta !== 'undefined') {
    if (!import.meta.env) {
      Object.defineProperty(import.meta, 'env', {
        value: testEnv,
        writable: false
      });
    } else {
      Object.assign(import.meta.env, testEnv);
    }
  } else {
    // Fallback: global Referenz, falls Code defensiv darauf prüft
    // (normalerweise nicht nötig, aber schadet nicht)
    global.import = { meta: { env: testEnv } };
  }
} catch {
  // Hard Fallback
  global.import = { meta: { env: testEnv } };
}

/* Optional zugänglich lassen */
global.__TEST_ENV__ = testEnv;

/* ---------------------------------------------------------
 * 2. Konsole: bestimmte React-Warnungen unterdrücken
 * --------------------------------------------------------- */
const origError = console.error;
console.error = (...args) => {
  if (/Warning:.*not wrapped in act/.test(args[0])) return;
  origError(...args);
};

/* ---------------------------------------------------------
 * 3. Blob / URL Mock (für Exporte)
 * --------------------------------------------------------- */
global.URL.createObjectURL = global.URL.createObjectURL || (() => 'blob:mock');
global.URL.revokeObjectURL = global.URL.revokeObjectURL || (() => {});

/* ---------------------------------------------------------
 * 4. WebSocket Basis-Mock
 * --------------------------------------------------------- */
class BaseTestWebSocket {
  static INSTANCES = [];
  readyState = 0; // CONNECTING
  sent = [];
  constructor(url) {
    this.url = url;
    BaseTestWebSocket.INSTANCES.push(this);
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.onopen && this.onopen();
    }, 0);
  }
  send(msg) {
    this.sent.push(msg);
  }
  close(code = 1000, reason = '') {
    this.readyState = 3; // CLOSED
    this.onclose && this.onclose({ code, reason });
  }
  _emit(obj) {
    this.onmessage && this.onmessage({ data: JSON.stringify(obj) });
  }
  _fail(code = 1006) {
    this.readyState = 3;
    this.onclose && this.onclose({ code, reason: 'test-fail' });
  }
}
global.WebSocket = BaseTestWebSocket;

/* ---------------------------------------------------------
 * 5. (Optional) Timer nicht global faken – lieber pro Test
 * --------------------------------------------------------- */
// jest.useFakeTimers(); // nur aktivieren, falls wirklich global nötig
