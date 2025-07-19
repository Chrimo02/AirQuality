// src/components/ControlPanel.jsx
import React, { useEffect, useState } from 'react';
import DeviceToggleButton from './DeviceToggleButton';
import ModeSwitch from './ModeSwitch';
import { getDevicesStatus } from '../services/devices';

export default function ControlPanel() {
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const status = await getDevicesStatus();
      setDeviceStatus(status);
    } catch (e) {
      console.error('Gerätestatus konnte nicht geladen werden', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="control-panel card" style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Gerätesteuerung</h3>

      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <DeviceToggleButton
          name="Ventilator"
          deviceKey="ventilator"
          status={deviceStatus?.ventilator?.status}
          onRefresh={refresh}
        />
        <DeviceToggleButton
          name="Diffusor"
          deviceKey="diffusor"
          status={deviceStatus?.diffusor?.status}
          onRefresh={refresh}
        />
      </div>

      <ModeSwitch
        initialMode="manual"
        onModeChange={() => {
          // Nach dem Umschalten (auto / manual) Status erneut holen
          refresh();
        }}
      />

      <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: '#555' }}>
        {loading
          ? 'Aktualisiere Status…'
          : deviceStatus
            ? `Ventilator: ${deviceStatus.ventilator.status} | Diffusor: ${deviceStatus.diffusor.status}`
            : 'Keine Daten'}
      </div>
    </div>
  );
}
