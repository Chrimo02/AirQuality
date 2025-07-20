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

    (async () => {
      try {
        const first = await fetchLiveData();
        if (mounted) setLive(first);
      } catch {
        // optional: setWsState('HTTP_FAIL');
      }
    })();

    cleanupRef.current = connectLive(
      payload => { if (mounted) setLive(payload); },
      state => setWsState(state),
      options
    );

    return () => {
      mounted = false;
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [active, options.maxRetries, options.baseDelay]);

  return { live, wsState };
}
