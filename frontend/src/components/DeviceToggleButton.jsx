// src/components/DeviceToggleButton.jsx
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
    <button onClick={handleToggle} disabled={loading}>
      {name}: {isOn ? 'An' : 'Aus'}
    </button>
  );
}
