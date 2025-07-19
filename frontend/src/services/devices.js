// src/services/devices.js
import { apiClient } from './api';

const BASE = ''; // apiClient hat bereits BASE_URL gesetzt

// Hilfs-Wrapper für Fehler
function wrapError(e, msg) {
  console.error(msg, e);
  throw e;
}

/**
 * Holt den Status beider Geräte:
 * {
 *   ventilator: { name, status, ip },
 *   diffusor:   { name, status, ip }
 * }
 */
export async function getDevicesStatus() {
  try {
    const res = await apiClient.get(`${BASE}/devices/status`);
    return res.data;
  } catch (e) {
    wrapError(e, '[Devices] getDevicesStatus fehlgeschlagen');
  }
}

/**
 * Generische Steuerung eines Geräts.
 * device: 'ventilator' | 'diffusor'
 * action: 'on' | 'off' | 'auto'
 */
export async function controlDevice(device, action) {
  if (!['ventilator', 'diffusor'].includes(device)) {
    throw new Error('Ungültiges Gerät');
  }
  if (!['on', 'off', 'auto'].includes(action)) {
    throw new Error('Ungültige Action');
  }
  try {
    const res = await apiClient.put(
      `${BASE}/devices/${device}/control`,
      { action }
    );
    return res.data;
  } catch (e) {
    wrapError(e, `[Devices] controlDevice(${device}, ${action}) fehlgeschlagen`);
  }
}

/**
 * Globaler Modus:
 *  - 'auto'  => beide Geräte auf auto
 *  - 'manual'=> nichts erzwingen, nur Flag für UI
 */
export async function setMode(mode) {
  if (!['auto', 'manual'].includes(mode)) {
    throw new Error('Mode muss auto|manual sein');
  }
  if (mode === 'auto') {
    // Beide Geräte in Automatik
    await Promise.all([
      controlDevice('ventilator', 'auto'),
      controlDevice('diffusor', 'auto')
    ]);
  }
  // 'manual' bedeutet nur: UI zeigt manuell; tatsächlicher manueller Zustand kommt durch individuelle ON/OFF Klicks.
  return { mode };
}

/**
 * Convenience-Shortcuts (optional)
 */
export const setVentilator = action => controlDevice('ventilator', action);
export const setDiffusor   = action => controlDevice('diffusor', action);
