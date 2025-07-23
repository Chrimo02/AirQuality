// tests/components/DeviceControlPanel.test.jsx
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { jest } from '@jest/globals';

// ENV
beforeEach(() => {
  globalThis.__TEST_ENV__ = { VITE_API_URL: 'http://localhost:8000', VITE_USE_MOCK: 'true' };
});

// Fake-Timer aktivieren
beforeAll(() => {
  jest.useFakeTimers();
});
afterAll(() => {
  jest.useRealTimers();
});

// API exakt so mocken, wie die Komponente importiert
jest.mock('src/services/api', () => ({
  __esModule: true,
  fetchDeviceStatus: jest.fn(async () => ({
    ventilator: { status: 'off', auto: false },
    diffusor:   { status: 'off', auto: false },
  })),
  controlVentilator: jest.fn(async () => ({ status: 'on',  auto: false })),
  controlDiffusor:   jest.fn(async () => ({ status: 'on',  auto: false })),
}));

import DeviceControlPanel from 'src/components/DeviceControlPanel';

test('rendert Geräte', async () => {
  render(<DeviceControlPanel />);

  // Timer der useEffect-Timeouts ablaufen lassen
  await act(async () => {
    jest.advanceTimersByTime(1000);
    // microtasks flushen, damit das Promise des fetchDeviceStatus resolved
    await Promise.resolve();
  });

  expect(await screen.findByText(/Ventilator/i)).toBeInTheDocument();
  expect(await screen.findByText(/Diffusor/i)).toBeInTheDocument();
  expect(screen.queryByText(/Lade…/)).toBeNull();
});
