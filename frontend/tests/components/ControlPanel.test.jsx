// src/components/ControlPanel.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import ControlPanel from './ControlPanel';

// Wir mocken die Kind-Komponenten, um uns rein auf ControlPanel zu konzentrieren:
jest.mock('./DeviceToggleButton', () => ({ name, deviceKey }) => (
  <button data-testid={`toggle-${deviceKey}`}>{name}</button>
));
jest.mock('./ModeSwitch', () => () => (
  <div data-testid="modeswitch">ModeSwitch</div>
));

describe('ControlPanel', () => {
  beforeEach(() => {
    render(<ControlPanel />);
  });

  it('zeigt die Überschrift an', () => {
    expect(
      screen.getByRole('heading', { name: /Gerätesteuerung/i })
    ).toBeInTheDocument();
  });

  it('rendert drei DeviceToggleButtons mit den korrekten deviceKeys', () => {
    expect(screen.getByTestId('toggle-ventilator')).toHaveTextContent('Ventilator');
    expect(screen.getByTestId('toggle-diffusor')).toHaveTextContent('Aroma-Diffusor');
    expect(screen.getByTestId('toggle-led_ring')).toHaveTextContent('LED-Ring');
  });

  it('baut die ModeSwitch-Komponente ein', () => {
    expect(screen.getByTestId('modeswitch')).toBeInTheDocument();
  });
});
