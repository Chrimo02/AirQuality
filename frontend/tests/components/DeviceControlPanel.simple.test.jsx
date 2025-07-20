import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../src/services/api', () => ({
  fetchDeviceStatus: jest.fn(async () => ({
    ventilator: { name: 'Ventilator', status: 'off' },
    diffusor: { name: 'Diffusor', status: 'off' }
  })),
  controlVentilator: jest.fn(async () => ({ status: 'on' })),
  controlDiffusor: jest.fn(async () => ({ status: 'on' }))
}));

import DeviceControlPanel from '../../src/components/DeviceControlPanel';

describe('DeviceControlPanel – simpel', () => {
  test('rendert Geräte', async () => {
    render(<DeviceControlPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Ventilator/)).toBeInTheDocument();
      expect(screen.getByText(/Diffusor/)).toBeInTheDocument();
    });
  });
});
