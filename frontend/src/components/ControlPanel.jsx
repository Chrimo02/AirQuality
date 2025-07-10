import React from 'react';
import DeviceToggleButton from './DeviceToggleButton';
import ModeSwitch         from './ModeSwitch';

export default function ControlPanel() {
  return (
    <div className="control-panel card">
      <h3 style={{ marginBottom: '1rem' }}>Gerätesteuerung</h3>
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <DeviceToggleButton name="Ventilator"     deviceKey="ventilator" />
        <DeviceToggleButton name="Aroma-Diffusor" deviceKey="diffusor" />
        <DeviceToggleButton name="LED-Ring"       deviceKey="led_ring" />
      </div>
      <ModeSwitch />
    </div>
);
}
