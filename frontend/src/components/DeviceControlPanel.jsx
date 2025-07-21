// src/components/DeviceControlPanel.jsx
import React, { useEffect, useState, useCallback } from "react";
import { fetchDeviceStatus, controlVentilator, controlDiffusor } from "../services/api";

export default function DeviceControlPanel() {
  const [status, setStatus] = useState({ ventilator: { status: null, auto: false }, diffusor: { status: null, auto: false } });
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState(null);
  const [lastActionTs, setLastActionTs] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchDeviceStatus();
      setStatus({
        ventilator: { status: res.ventilator.status, auto: res.ventilator.auto ?? false },
        diffusor:   { status: res.diffusor.status,   auto: res.diffusor.auto   ?? false }
      });
    } catch (e) {
      console.warn("Gerätestatus konnte nicht geladen werden:", e);
      setError("Status nicht verfügbar");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadStatus, 1000);
    return () => clearTimeout(timer);
  }, [loadStatus]);

  const sendAction = async (device, action) => {
    setError(null);
    setLastActionTs(Date.now());
    setLoadingKey(`${device}:${action}`);
    try {
      const data = device === "ventilator"
        ? await controlVentilator(action)
        : await controlDiffusor(action);
      setStatus(prev => ({
        ...prev,
        [device]: {
          status: data.status,
          auto:   data.auto ?? prev[device].auto
        }
      }));
    } catch (e) {
      console.warn("Aktion fehlgeschlagen:", e);
      setError("Aktion fehlgeschlagen");
    } finally {
      setLoadingKey(null);
    }
  };

  const Btn = ({ device, desired, label }) => {
    const isActive = desired === "auto"
      ? status[device].auto
      : status[device].status === desired;
    const busy = loadingKey === `${device}:${desired}`;
    return (
      <button
        onClick={() => sendAction(device, desired)}
        disabled={busy}
        className={`px-3 py-1.5 rounded text-xs font-semibold border transition tracking-wide
                   ${isActive
                     ? "bg-cyan-600 text-white border-cyan-600"
                     : "bg-white text-cyan-600 border-cyan-400 hover:bg-cyan-50"}
                   ${busy ? "opacity-50" : ""}`}
      >
        {busy ? "…" : label}
      </button>
    );
  };

  return (
    <div className="aq-card flex flex-col gap-4">
      <h3 className="font-semibold text-sm text-slate-700 tracking-wide">Gerätesteuerung</h3>

      {error && <div className="text-red-600 text-xs">{error}</div>}
      {!status.ventilator.status && !error && <div className="text-xs">Lade…</div>}

      {status.ventilator.status && (
        <>
          {/* Ventilator */}
          <div className="flex flex-col gap-2 p-3 rounded border bg-white/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Ventilator</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-300 tracking-wide">
                {status.ventilator.status.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn device="ventilator" desired="on"  label="An" />
              <Btn device="ventilator" desired="off" label="Aus" />
              <Btn device="ventilator" desired="auto" label="Auto" />
              <button
                onClick={loadStatus}
                className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-600 bg-white hover:bg-slate-100"
                title="Neu laden"
              >⟳</button>
            </div>
          </div>

          {/* Diffusor */}
          <div className="flex flex-col gap-2 p-3 rounded border bg-white/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Diffusor</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-300 tracking-wide">
                {status.diffusor.status.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn device="diffusor" desired="on"  label="An" />
              <Btn device="diffusor" desired="off" label="Aus" />
              <Btn device="diffusor" desired="auto" label="Auto" />
              <button
                onClick={loadStatus}
                className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-600 bg-white hover:bg-slate-100"
                title="Neu laden"
              >⟳</button>
            </div>
          </div>
        </>
      )}

      {lastActionTs && (
        <div className="text-[10px] text-slate-500">
          Letzte Aktion: {new Date(lastActionTs).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
