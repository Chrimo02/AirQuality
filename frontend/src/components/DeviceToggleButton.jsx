// src/components/DeviceToggleButton.jsx
import React, { useState } from 'react';
import { controlDevice } from '../services/devices';

export default function DeviceToggleButton({ name, deviceKey, status, onRefresh }) {
  const [loading, setLoading] = useState(false);

  const isOn = status === 'on';

  const toggle = async () => {
    setLoading(true);
    try {
      await controlDevice(deviceKey, isOn ? 'off' : 'on');
      if (onRefresh) onRefresh();
    } catch (e) {
      alert(`Fehler beim Schalten von ${name}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        backgroundColor: isOn ? '#71e4f8' : '#ccc',
        color: '#1f2937',
        border: 'none',
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem',
        minWidth: '140px',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background-color .2s'
      }}
      title={isOn ? 'Ausschalten' : 'Einschalten'}
    >
      {name}: {isOn ? 'An' : 'Aus'}
      {loading && ' …'}
    </button>
  );
}
