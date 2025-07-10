// src/services/devices.js

// Mock zum Ein/Aus-Schalten der Geräte
export const toggleDevice = async (deviceKey, state) => {
  console.log(`[Mock] toggleDevice: ${deviceKey} → ${state}`);
  await new Promise(r => setTimeout(r, 300));
  return { success: true };
};

// Mock zum Modus-Wechsel
export const setMode = async (mode) => {
  console.log(`[Mock] setMode: ${mode}`);
  await new Promise(r => setTimeout(r, 200));
  return { mode };
};
