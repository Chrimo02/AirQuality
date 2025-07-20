import { useEffect, useState, useCallback } from "react";
import { fetchDeviceStatus, controlVentilator, controlDiffusor } from "../services/api";

/**
 * Gerätesteuerung mit "optimistic UI":
 * - Sofortiger Button-State beim Klicken
 * - Nach erfolgreichem/fehlschlagendem Request wird (re)validiert
 */
export default function DeviceControlPanel() {
  const [status, setStatus] = useState({
    ventilator: { status: null },
    diffusor: { status: null }
  });
  const [loadingKey, setLoadingKey] = useState(null); // "ventilator:on" etc.
  const [error, setError] = useState(null);
  const [lastActionTs, setLastActionTs] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetchDeviceStatus();
      setStatus({
        ventilator: { status: res.ventilator?.status || null },
        diffusor: { status: res.diffusor?.status || null }
      });
    } catch (e) {
      // Bei Mock einfach ignorieren – oder Fehlermeldung setzen
      setError("Status nicht abrufbar");
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const iv = setInterval(loadStatus, 15000);
    return () => clearInterval(iv);
  }, [loadStatus]);

  async function sendAction(device, action) {
    setError(null);
    setLastActionTs(Date.now());
    const optimistic = action; // "on" | "off" | "auto"
    setStatus(prev => ({
      ...prev,
      [device]: { status: optimistic }
    }));
    const key = `${device}:${action}`;
    setLoadingKey(key);
    try {
      if (device === "ventilator") {
        await controlVentilator(action);
      } else {
        await controlDiffusor(action);
      }
      // Revalidate
      await loadStatus();
    } catch (e) {
      setError("Aktion fehlgeschlagen");
    } finally {
      setLoadingKey(null);
    }
  }

  const Btn = ({ device, desired, label }) => {
    const active = status[device].status === desired;
    const busy = loadingKey === `${device}:${desired}`;
    return (
      <button
        onClick={() => sendAction(device, desired)}
        disabled={busy}
        className={`px-3 py-1.5 rounded text-xs font-semibold border transition tracking-wide
          ${active
            ? "bg-cyan-600 text-white border-cyan-600"
            : "bg-white text-cyan-600 border-cyan-400 hover:bg-cyan-50"}
          disabled:opacity-50`}
      >
        {busy ? "…" : label}
      </button>
    );
  };

  const DeviceRow = ({ title, dkey }) => {
    const st = status[dkey].status ? status[dkey].status.toUpperCase() : "—";
    return (
      <div className="flex flex-col gap-2 p-3 rounded border border-slate-200 bg-white/80">
        <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">{title}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-300 tracking-wide">
              {st}
            </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn device={dkey} desired="on"   label="An" />
          <Btn device={dkey} desired="off"  label="Aus" />
          <Btn device={dkey} desired="auto" label="Auto" />
          <button
            onClick={loadStatus}
            className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-600 bg-white hover:bg-slate-100"
            title="Neu laden"
          >⟳</button>
        </div>
      </div>
    );
  };

  return (
    <div className="aq-card flex flex-col gap-4">
      <h3 className="font-semibold text-sm text-slate-700 tracking-wide">Gerätesteuerung</h3>
      {error && <div className="text-xs text-amber-600">{error}</div>}
      <DeviceRow title="Ventilator" dkey="ventilator" />
      <DeviceRow title="Diffusor" dkey="diffusor" />
      {lastActionTs && (
        <div className="text-[10px] text-slate-500">
          Letzte Aktion: {new Date(lastActionTs).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
