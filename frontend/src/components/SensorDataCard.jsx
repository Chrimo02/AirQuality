// src/components/SensorDataCard.jsx
import React from 'react';
import {
  Thermometer,
  Droplet,
  Wind,
  Activity,
  Sun,
  Zap,
  Cloud
} from 'lucide-react';

// Mapping Label → Icon
const ICONS = {
  Temperatur:       <Thermometer size={24} />,
  Feuchte:          <Droplet size={24} />,
  Luftdruck:        <Wind size={24} />,       // kein Barometer, sondern Wind
  'VOC-Index':      <Activity size={24} />,
  bVOCeq:           <Sun size={24} />,        // Sonne als Symbol für VOC-Äquivalent
  GASest:           <Zap size={24} />,
  'CO₂-Äquivalent': <Cloud size={24} />       // Wolke für CO₂-Äquivalent
};

// Status-Picker nach Wert
const STATUS = {
  Temperatur: val =>
    val < 16 || val > 28
      ? 'bg-red-100 border-red-500'
      : val < 18 || val > 24
        ? 'bg-yellow-100 border-yellow-500'
        : 'bg-green-100 border-green-500',

  Feuchte: val =>
    val < 30 || val > 60
      ? 'bg-red-100 border-red-500'
      : val < 50
        ? 'bg-yellow-100 border-yellow-500'
        : 'bg-green-100 border-green-500',

  Luftdruck: () =>
    'bg-gray-50 border-gray-300',

  'CO₂-Äquivalent': val =>
    val > 2000
      ? 'bg-red-100 border-red-500'
      : val > 1000
        ? 'bg-yellow-100 border-yellow-500'
        : 'bg-green-100 border-green-500',

  'VOC-Index': val =>
    val > 0.61
      ? 'bg-red-100 border-red-500'
      : val > 0.05
        ? 'bg-yellow-100 border-yellow-500'
        : 'bg-green-100 border-green-500',

  // bVOCeq und GASest nutzen dieselbe Skala wie VOC-Index
  bVOCeq: val => STATUS['VOC-Index'](val),
  GASest: val => STATUS['VOC-Index'](val)
};

export default function SensorDataCard({ label, value, unit }) {
  const Icon = ICONS[label] || null;
  const statusClasses = STATUS[label]
    ? STATUS[label](value)
    : 'bg-gray-50 border-gray-300';

  return (
    <div className={`card border p-4 ${statusClasses}`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon}
        <h3 className="text-lg font-semibold">{label}</h3>
      </div>
      <p className="text-3xl font-bold">
        {value !== undefined ? value : '--'} {unit}
      </p>
    </div>
  );
}
