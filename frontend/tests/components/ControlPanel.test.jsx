// tests/components/ControlPanel.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import ControlPanel from '../../src/components/ControlPanel';

describe('ControlPanel', () => {
  beforeEach(() => {
    render(<ControlPanel />);
  });

  it('zeigt die Überschrift an', () => {
    expect(
      screen.getByRole('heading', { level: 3, name: /Gerätesteuerung/i })
    ).toBeInTheDocument();
  });

  it('rendert drei Toggle-Buttons', () => {
    expect(screen.getByRole('button', { name: /Ventilator:/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aroma-Diffusor:/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /LED-Ring:/i })).toBeInTheDocument();
  });

  it('zeigt Automatik- und Manuell-Buttons für den Modus', () => {
    expect(screen.getByRole('button', { name: /^Automatik$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Manuell$/i })).toBeInTheDocument();
  });
});
