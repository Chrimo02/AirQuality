// src/services/devices.js

/** Mock-Toggle für Geräte */
export const toggleDevice = async (deviceName, state) => {
  console.log(`[Mock] toggleDevice: ${deviceName} → ${state}`);
  await new Promise(r => setTimeout(r, 300));  // Simuliere Netz-Delay
  return { success: true };
};

/** Mock-Moduswechsel */
export const setMode = async (mode) => {
  console.log(`[Mock] setMode: ${mode}`);
  await new Promise(r => setTimeout(r, 200));
  return { mode };
};
