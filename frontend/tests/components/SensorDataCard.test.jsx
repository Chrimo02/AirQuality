// src/components/SensorDataCard.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import SensorDataCard from './SensorDataCard';

describe('SensorDataCard', () => {
  it('zeigt Label, Wert und Einheit korrekt an', () => {
    render(<SensorDataCard label="Temperatur" value={23.4} unit="°C" timestamp="2025-07-10T12:00:00Z" />);
    // Label
    expect(screen.getByRole('heading', { name: /Temperatur/i })).toBeInTheDocument();
    // Wert + Einheit
    expect(screen.getByText('23.4 °C')).toBeInTheDocument();
    // Zeitstempel
    expect(screen.getByText(/zu 12:00/i)).toBeInTheDocument();
  });

  it('verwendet korrekte Farbklasse für grünen Status', () => {
    render(<SensorDataCard label="Temperatur" value={22} unit="°C" />);
    const card = screen.getByText('22 °C').closest('div');
    expect(card).toHaveClass('bg-green-100');
  });
});
