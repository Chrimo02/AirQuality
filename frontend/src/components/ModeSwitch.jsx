import React, { useState } from 'react';
import { setMode } from '../services/devices';

export default function ModeSwitch({ initialMode = 'auto' }) {
  const [mode, setLocalMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);

  const switchMode = async newMode => {
    if (newMode === mode) return;
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

  const btnStyle = (active) => ({
    backgroundColor: active ? '#71e4f8' : '#ccc',
    color: '#1f2937',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    cursor: loading ? 'not-allowed' : 'pointer'
  });

  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
      <button
        onClick={() => switchMode('auto')}
        disabled={loading}
        style={btnStyle(mode === 'auto')}
      >
        Automatik
      </button>
      <button
        onClick={() => switchMode('manual')}
        disabled={loading}
        style={btnStyle(mode === 'manual')}
      >
        Manuell
      </button>
    </div>
  );
}
