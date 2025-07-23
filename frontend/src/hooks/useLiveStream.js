// src/hooks/useLiveStream.js
import { useEffect, useRef, useState } from 'react';
import { fetchLiveData, connectLive } from '../services/api';

export function useLiveStream(active = true, options = {}) {
  const [wsState, setWsState] = useState('INIT');
  const [live, setLive] = useState(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    let mounted = true;

    // 1) Initialer HTTP‑Snapshot
    fetchLiveData()
      .then(first => mounted && setLive(first))
      .catch(() => console.warn('[useLiveStream] HTTP initial load failed'));

    // 2) WebSocket starten
    cleanupRef.current = connectLive(
      payload => mounted && setLive(payload),
      state   => setWsState(state)
    );

    return () => {
      mounted = false;
      cleanupRef.current?.();
    };
  }, [active]);

  // --- Geräte-Zustände extrahieren ---
  const devices = live
    ? {
        ventilator: {
          status: live.ventilator_state ?? null,
          auto:   live.ventilator_auto  ?? false
        },
        diffusor: {
          status: live.diffusor_state   ?? null,
          auto:   live.diffusor_auto    ?? false
        }
      }
    : {
        ventilator: { status: null, auto: false },
        diffusor:   { status: null, auto: false }
      };

  return { live, wsState, devices };
}
