// src/components/ModeSwitch.jsx
import React, { useState } from 'react';
import { setMode } from '../services/devices';

export default function ModeSwitch({ initialMode = 'auto' }) {
  const [mode, setLocalMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const newMode = e.target.value; // 'auto' oder 'manual'
    setLoading(true);
    try {
      await setMode(newMode);
      setLocalMode(newMode);
    } catch (err) {
      console.error('Moduswechsel-Fehler:', err);
      alert('Modus konnte nicht gesetzt werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '0.5rem' }}>
      <label htmlFor="mode-select" style={{ marginRight: '0.5rem' }}>Modus:</label>
      <select
        id="mode-select"
        value={mode}
        onChange={handleChange}
        disabled={loading}
      >
        <option value="auto">Automatik</option>
        <option value="manual">Manuell</option>
      </select>
    </div>
  );
}
