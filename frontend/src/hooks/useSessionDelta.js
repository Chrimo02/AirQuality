// src/hooks/useSessionDelta.js
import { useEffect, useRef, useState } from 'react';
import { fetchSessionData, fetchSessionDataSince } from '../services/api';

export function useSessionDelta(sessionId, enabled = true, pollingMs = 15000) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef(null);

  useEffect(() => {
    if (!enabled || !sessionId) return;
    let mounted = true;
    setLoading(true);
    fetchSessionData(sessionId)
      .then(data => { if (mounted) { setRows(data); lastFetchRef.current = Date.now(); } })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [sessionId, enabled]);

  useEffect(() => {
    if (!enabled || !sessionId) return;
    const iv = setInterval(async () => {
      if (!rows.length) return;
      const lastTs = rows[rows.length - 1].timestamp;
      try {
        const delta = await fetchSessionDataSince(sessionId, lastTs);
        if (delta.length) setRows(prev => [...prev, ...delta]);
      } catch {/* ignore */}
    }, pollingMs);
    return () => clearInterval(iv);
  }, [enabled, sessionId, rows, pollingMs]);

  return { rows, loading };
}
