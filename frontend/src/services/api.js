export const fetchLatestSensor = async () => ({
  co2: Math.round(400 + Math.random()*100),
  temp: +(21 + Math.random()*4).toFixed(1),
  pm25: Math.round(5 + Math.random()*15),
  humidity: Math.round(35 + Math.random()*25),
  timestamp: new Date().toISOString()
});

export const fetchSensorHistory = async () => {
  const now = Date.now();
  return Array.from({ length:12 }).map((_,i) => ({
    timestamp: new Date(now - (11-i)*5*60*1000).toISOString(),
    co2: Math.round(400 + Math.random()*100),
    temp: +(21 + Math.random()*4).toFixed(1),
    pm25: Math.round(5 + Math.random()*15),
    humidity: Math.round(35 + Math.random()*25),
  }));
};

export function createWebSocket(onMessage) {
  const interval = setInterval(() => {
    onMessage({
      co2: Math.round(400 + Math.random()*100),
      temp:+(21 + Math.random()*4).toFixed(1),
      pm25: Math.round(5 + Math.random()*15),
      humidity: Math.round(35 + Math.random()*25),
      timestamp: new Date().toISOString()
    });
  }, 5000);
  return { close: () => clearInterval(interval) };
}
