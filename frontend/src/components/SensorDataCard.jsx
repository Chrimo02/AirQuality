import React from 'react';
import {
  Thermometer,
  Droplet,
  Wind,
  CloudSnow,
  Activity,
  Sun,
  Zap
} from 'lucide-react';

// Mapping label → Icon
const ICONS = {
  Temperatur: <Thermometer size={24} />, 
  Feuchte:     <Droplet size={24} />, 
  Luftdruck:   <Wind size={24} />, 
  'VOC-Index': <Activity size={24} />, 
  bVOCeq:      <Sun size={24} />, 
  GASest:      <Zap size={24} />, 
  'CO₂-Äquivalent': <CloudSnow size={24} />
};

// Wertebereiche für Statusfarben
const STATUS = {
  Temperatur:  val => val < 16 || val > 28 ? 'bg-red-100 border-red-500' : val < 18 || val > 24 ? 'bg-yellow-100 border-yellow-500' : 'bg-green-100 border-green-500',
  Feuchte:     val => val < 30 || val > 60 ? 'bg-red-100 border-red-500' : val < 50 ? 'bg-yellow-100 border-yellow-500' : 'bg-green-100 border-green-500',
  'CO₂-Äquivalent': val => val > 2000 ? 'bg-red-100 border-red-500' : val > 1000 ? 'bg-yellow-100 border-yellow-500' : 'bg-green-100 border-green-500',
  'VOC-Index': val => val > 0.61 ? 'bg-red-100 border-red-500' : val > 0.05 ? 'bg-yellow-100 border-yellow-500' : 'bg-green-100 border-green-500',
  bVOCeq:      val => STATUS['VOC-Index'](val),
  GASest:      val => STATUS['VOC-Index'](val),
  Luftdruck:   () => 'bg-gray-50 border-gray-300' // neutral
};

export default function SensorDataCard({ label, value, unit, timestamp }) {
  const Icon = ICONS[label] || null;
  const className = STATUS[label] ? STATUS[label](value) : 'bg-gray-50 border-gray-300';
  const timeLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`card border-l-4 p-4 ${className}`}>  
      <div className="flex items-center gap-2">
        {Icon}
        <h3 className="text-lg font-semibold">{label}</h3>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {value} {unit}
      </p>
      {timeLabel && <small className="text-gray-500">zu {timeLabel}</small>}
    </div>
  );
}