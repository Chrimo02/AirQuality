// src/components/ControlPanel.jsx
import React from 'react';
import DeviceToggleButton from './DeviceToggleButton';
import ModeSwitch from './ModeSwitch';

export default function ControlPanel() {
  return (
    <div className="card">
      <h3>Gerätesteuerung</h3>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <DeviceToggleButton name="Ventilator" deviceKey="ventilator" />
        <DeviceToggleButton name="Aroma-Diffusor"  deviceKey="diffusor" />
        <DeviceToggleButton name="LED-Ring"      deviceKey="led_ring" />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <ModeSwitch />
      </div>
    </div>
  );
}
