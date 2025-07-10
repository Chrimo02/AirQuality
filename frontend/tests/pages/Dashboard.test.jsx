// src/pages/Dashboard.test.jsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './Dashboard';
import * as api from '../services/api';

// Mock aller API-Aufrufe
jest.spyOn(api, 'fetchEnvironments').mockResolvedValue([{ id: 'env1', name: 'Testraum' }]);
jest.spyOn(api, 'fetchSessions').mockResolvedValue([{ id: 's1', start_time: new Date().toISOString(), status: 'running' }]);
jest.spyOn(api, 'fetchLatestSensor').mockResolvedValue({ TEMP: 24, HUMID: 55, ATM:1010, VOCAQI:50, bVOCeq:0.5, GASest:0.2, CO2eq:600, timestamp: new Date().toISOString() });
jest.spyOn(api, 'fetchSensorHistory').mockResolvedValue([]);
jest.spyOn(api, 'createWebSocket').mockImplementation((cb) => {
  // kein Live-Update im Test
  return { close: jest.fn() };
});

describe('Dashboard Integration', () => {
  it('zeigt nach Auswahl eines Raums die SensorCards an', async () => {
    render(
      <MemoryRouter initialEntries={['/environments/env1']}>
        <Routes>
          <Route path="/environments/:envId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Warte kurz auf initiales Fetch
    await waitFor(() => expect(api.fetchEnvironments).toHaveBeenCalled());
    // Da envId via URL ist, sollten direkt SensorCards gerendert werden
    expect(await screen.findByText(/Temperatur/i)).toBeInTheDocument();
    expect(screen.getByText(/24 °C/)).toBeInTheDocument();
  });

  it('erzeugt neue Session beim Klick auf "+ Neue Session"', async () => {
    const newSession = { id: 's2', start_time: new Date().toISOString(), status: 'running' };
    api.startSession = jest.fn().mockResolvedValue(newSession);

    render(
      <MemoryRouter initialEntries={['/environments/env1']}>
        <Routes>
          <Route path="/environments/:envId" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Button finden und klicken
    const btn = await screen.findByRole('button', { name: /\+ Neue Session/i });
    fireEvent.click(btn);

    await waitFor(() => expect(api.startSession).toHaveBeenCalledWith('env1'));
    // Neuer Session-Button müsste jetzt gerendert sein
    expect(screen.getByRole('button', { name: /s2/i })).toBeInTheDocument();
  });
});
