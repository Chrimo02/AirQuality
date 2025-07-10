// tests/pages/Dashboard.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from 'src/pages/Dashboard';
import * as api from 'src/services/api';

// 1. gesamtes API‐Modul mocken
jest.mock('src/services/api');

// 2. alle Child‐Komponenten stubben
jest.mock('src/components/SensorDataCard', () => ({ label, value, unit }) => (
  <div data-testid={`card-${label}`}>{label}: {value} {unit}</div>
));
jest.mock('src/components/ParticleChartCard', () => () => (
  <div data-testid="particle-chart" />
));
jest.mock('src/components/ChartSection', () => () => (
  <div data-testid="chart-section" />
));
jest.mock('src/components/ControlPanel', () => () => (
  <div data-testid="control-panel" />
));

describe('Dashboard', () => {
  beforeEach(() => {
    // Live‐Daten stubben
    api.fetchLatestSensor.mockResolvedValue({
      TEMP: 22,
      HUMID: 55,
      ATM: 1013,
      VOCAQI: 25,
      bVOCeq: 0.3,
      GASest: 0.4,
      CO2eq: 415,
      timestamp: '2025-07-10T12:00:00Z'
    });
    // History stubben (leer reicht)
    api.fetchSensorHistory.mockResolvedValue([]);
    // WebSocket stubben
    api.createWebSocket.mockImplementation(onMsg => {
      // direkt einmaliges Update
      onMsg({
        TEMP: 22,
        HUMID: 55,
        ATM: 1013,
        VOCAQI: 25,
        bVOCeq: 0.3,
        GASest: 0.4,
        CO2eq: 415,
        timestamp: '2025-07-10T12:00:00Z'
      });
      return { close: jest.fn() };
    });
  });

  afterEach(() => jest.resetAllMocks());

  it('zeigt nach Laden eine Karte für Temperatur', async () => {
    render(<Dashboard />);

    // warte, bis unser SensorDataCard‐Stub gerendert ist
    await waitFor(() =>
      expect(screen.getByTestId('card-Temperatur')).toBeInTheDocument()
    );
    expect(screen.getByTestId('card-Temperatur')).toHaveTextContent('Temperatur: 22 °C');
  });
});
