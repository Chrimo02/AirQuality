// src/hooks/useLiveStream.js
import { useEffect, useRef, useState } from 'react';
import { fetchLiveData, connectLive } from '../services/api';

export function useLiveStream(active = true, options = {}) {
  const [wsState, setWsState] = useState('INIT');
  const [live, setLive] = useState(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    console.log('[useLiveStream] useEffect, active=', active)
    if (!active) return
    let mounted = true
    // 1) Initialer HTTP‑Snapshot
    fetchLiveData()
      .then(first => mounted && setLive(first))
      .catch(() => console.warn('[useLiveStream] HTTP initial load failed'))
    // 2) WebSocket starten
    cleanupRef.current = connectLive(
      payload => mounted && setLive(payload),
      state   => setWsState(state)
    )
    return () => {
      console.log('[useLiveStream] cleanup')
      mounted = false
      cleanupRef.current?.()
    }
  }, [active])
  return { live, wsState }
}


