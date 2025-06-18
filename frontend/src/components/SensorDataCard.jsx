import React from 'react';
import {
  Thermometer,
  Droplet,
  Wind,
  Activity,
  Sun,
  Zap,
  CloudSnow
} from 'lucide-react';

const ICONS = {
  Temperatur:       <Thermometer size={28} className="text-indigo-500" />,
  Feuchte:          <Droplet size={28}    className="text-teal-500"    />,
  Luftdruck:        <Wind size={28}       className="text-orange-500"  />,
  'VOC-Index':      <Activity size={28}   className="text-fuchsia-500" />,
  bVOCeq:           <Sun size={28}        className="text-green-500"   />,
  GASest:           <Zap size={28}        className="text-red-500"     />,
  'CO₂-Äquivalent': <CloudSnow size={28}  className="text-cyan-500"    />
};

// Farbklassen je Range
const STATUS = {
  Temperatur: val =>
    val < 16 || val > 28 ? 'border-red-400 bg-red-50'
  : val < 18 || val > 24 ? 'border-yellow-400 bg-yellow-50'
  :                        'border-green-400 bg-green-50',

  Feuchte: val =>
    val < 30 || val > 60 ? 'border-red-400 bg-red-50'
  : val < 50             ? 'border-yellow-400 bg-yellow-50'
  :                        'border-green-400 bg-green-50',

  'CO₂-Äquivalent': val =>
    val > 2000 ? 'border-red-400 bg-red-50'
  : val > 1000 ? 'border-yellow-400 bg-yellow-50'
  :              'border-green-400 bg-green-50',

  'VOC-Index': val =>
    val > 0.61 ? 'border-red-400 bg-red-50'
  : val > 0.05 ? 'border-yellow-400 bg-yellow-50'
  :              'border-green-400 bg-green-50',

  bVOCeq: val => STATUS['VOC-Index'](val),
  GASest: val => STATUS['VOC-Index'](val),

  Luftdruck: () => 'border-gray-300 bg-gray-50'
};

export default function SensorDataCard({ label, value, unit, timestamp }) {
  const Icon = ICONS[label] || null;
  const stateCls = STATUS[label] ? STATUS[label](value) : 'border-gray-300 bg-gray-50';
  const timeLbl = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`flex flex-col justify-between p-4 rounded-lg shadow-sm border-l-4 ${stateCls} h-40`}>
      <div className="flex items-center gap-3">
        {Icon}
        <span className="text-base font-medium text-gray-700">{label}</span>
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="ml-1 text-xl text-gray-600">{unit}</span>
      </div>
      {timeLbl && (
        <div className="text-right text-sm text-gray-500">zu {timeLbl}</div>
      )}
    </div>
  );
}
