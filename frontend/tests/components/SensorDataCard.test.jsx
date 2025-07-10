// tests/components/SensorDataCard.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import SensorDataCard from '../../src/components/SensorDataCard';

describe('SensorDataCard', () => {
  it('zeigt Label, Wert und Einheit korrekt an', () => {
    render(
      <SensorDataCard
        label="Temperatur"
        value={23.4}
        unit="°C"
      />
    );
    expect(
      screen.getByRole('heading', { name: /Temperatur/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText('23.4 °C')
    ).toBeInTheDocument();
  });
});
