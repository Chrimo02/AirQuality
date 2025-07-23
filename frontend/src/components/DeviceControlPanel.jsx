// src/components/DeviceControlPanel.jsx
import React, { useState } from "react";
import { controlVentilator, controlDiffusor } from "../services/api";
import { useLiveStream } from "../hooks/useLiveStream";

export default function DeviceControlPanel() {
  // Holt live + devices aus WS
  const { devices: status } = useLiveStream(true);
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState(null);
  const [lastActionTs, setLastActionTs] = useState(null);

  const sendAction = async (device, action) => {
    setError(null);
    setLastActionTs(Date.now());
    setLoadingKey(`${device}:${action}`);
    try {
      if (device === "ventilator") {
        await controlVentilator(action);
      } else {
        await controlDiffusor(action);
      }
      // Kein setState nötig → WS aktualisiert automatisch
    } catch (e) {
      console.warn("Aktion fehlgeschlagen:", e);
      setError("Aktion fehlgeschlagen");
    } finally {
      setLoadingKey(null);
    }
  };

  const Btn = ({ device, desired, label }) => {
    const isAutoBtn     = desired === "auto";
    const isAutoActive  = status[device].auto;
    const isOnOffActive = status[device].status === desired;
    const busy = loadingKey === `${device}:${desired}`;

    const base = "px-3 py-1.5 rounded text-xs font-semibold border transition tracking-wide";
    const filledActive   = "bg-cyan-600 text-white border-cyan-600";
    const inactive       = "bg-white text-cyan-600 border-cyan-400 hover:bg-cyan-50";
    const hintActiveRing = "bg-white text-cyan-600 border-cyan-500 ring-2 ring-cyan-400/70";

    let cls;
    if (isAutoBtn) {
      cls = isAutoActive ? filledActive : inactive;
    } else {
      if (isAutoActive && isOnOffActive) {
        cls = hintActiveRing;          // Auto aktiv, On/Off trotzdem sichtbar
      } else if (!isAutoActive && isOnOffActive) {
        cls = filledActive;            // Manueller Modus
      } else {
        cls = inactive;
      }
    }

    return (
      <button
        onClick={() => sendAction(device, desired)}
        disabled={busy}
        className={`${base} ${cls} ${busy ? "opacity-50" : ""}`}
      >
        {busy ? "…" : label}
      </button>
    );
  };

  const StatusBadge = ({ dev }) => (
    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-300 tracking-wide">
      {status[dev].status?.toUpperCase()}
      {status[dev].auto && " · AUTO"}
    </span>
  );

  if (!status.ventilator.status && !error) {
    return (
      <div className="aq-card flex flex-col gap-4">
        <h3 className="font-semibold text-sm text-slate-700 tracking-wide">Gerätesteuerung</h3>
        <div className="text-xs">Lade…</div>
      </div>
    );
  }

  return (
    <div className="aq-card flex flex-col gap-4">
      <h3 className="font-semibold text-sm text-slate-700 tracking-wide">Gerätesteuerung</h3>

      {error && <div className="text-red-600 text-xs">{error}</div>}

      {/* Ventilator */}
      <div className="flex flex-col gap-2 p-3 rounded border bg-white/80">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Ventilator</span>
          <StatusBadge dev="ventilator" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn device="ventilator" desired="on"   label="An" />
          <Btn device="ventilator" desired="off"  label="Aus" />
          <Btn device="ventilator" desired="auto" label="Auto" />
        </div>
      </div>

      {/* Diffusor */}
      <div className="flex flex-col gap-2 p-3 rounded border bg-white/80">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Diffusor</span>
          <StatusBadge dev="diffusor" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn device="diffusor" desired="on"   label="An" />
          <Btn device="diffusor" desired="off"  label="Aus" />
          <Btn device="diffusor" desired="auto" label="Auto" />
        </div>
      </div>

      {lastActionTs && (
        <div className="text-[10px] text-slate-500">
          Letzte Aktion: {new Date(lastActionTs).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
