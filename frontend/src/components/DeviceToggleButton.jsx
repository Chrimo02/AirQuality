import React, { useState } from 'react';
import { toggleDevice } from '../services/devices';

export default function DeviceToggleButton({ name, deviceKey }) {
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleDevice(deviceKey, !isOn);
      setIsOn(prev => !prev);
    } catch (err) {
      console.error('Toggle-Fehler:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        backgroundColor: isOn ? '#71e4f8' : '#ccc',
        color: '#1f2937',
        border: 'none',
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem',
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      {name}: {isOn ? 'An' : 'Aus'}
    </button>
  );
}
