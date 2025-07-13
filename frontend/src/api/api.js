const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

class AirQualityAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.websocket = null;
        this.liveDataCache = null;
    }

    // Generische HTTP-Request-Methode
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
            }

            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`API Request Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // HTTP-Methoden
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Sessions API
    async getSessions() {
        return this.get('/sessions');
    }

    async getSession(sessionId) {
        return this.get(`/sessions/${sessionId}`);
    }

    async createSession(sessionData) {
        if (!sessionData.name || !sessionData.name.trim()) {
            throw new Error('Session name is required');
        }
        
        if (!sessionData.session_type || !['indoor', 'outdoor'].includes(sessionData.session_type)) {
            throw new Error('Session type must be either "indoor" or "outdoor"');
        }

        return this.post('/sessions', {
            name: sessionData.name.trim(),
            location: sessionData.location || null,
            session_type: sessionData.session_type
        });
    }

    async endSession(sessionId) {
        return this.put(`/sessions/${sessionId}/end`);
    }

    async getSessionData(sessionId, limit = 1000) {
        return this.get(`/sessions/${sessionId}/data?limit=${limit}`);
    }

    async getSessionDataSince(sessionId, timestamp) {
        return this.get(
          `/sessions/${sessionId}/data/since/${encodeURIComponent(timestamp)}`
        );
    }

    // Live Data API
    async getLiveData() {
        try {
            const data = await this.get('/live-data');
            this.liveDataCache = data;
            return data;
        } catch (error) {
            if (this.liveDataCache) {
                console.warn('Using cached live data due to API error:', error);
                return this.liveDataCache;
            }
            throw error;
        }
    }

    // Device Control 
    async getDevicesStatus() {
        return this.get('/devices/status');
    }

    async controlVentilator(action) {
        if (!['on', 'off', 'auto'].includes(action)) {
            throw new Error('Invalid action. Must be "on", "off", or "auto"');
        }
        return this.put('/devices/ventilator/control', { action });
    }

    async controlDiffusor(action) {
        if (!['on', 'off', 'auto'].includes(action)) {
            throw new Error('Invalid action. Must be "on", "off", or "auto"');
        }
        return this.put('/devices/diffusor/control', { action });
    }

    async getAirQualityColors() {
        return this.get('/air-quality/colors');
    }

    async getCurrentSessionInfo() {
        return this.get('/current-session-info');
    }

   
   connectWebSocket(onMessage, onError = null, onClose = null, onOpen = null) {
  if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
    return this.websocket;
  }

  try {
    this.websocket = new WebSocket(`${WS_BASE_URL}/ws/live-data`);

    this.websocket.onopen = () => {
      console.log('WebSocket connection established');
      if (onOpen) onOpen();
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);


        this.liveDataCache = data;
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    this.websocket.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      if (onClose) onClose(event);

      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          this.connectWebSocket(onMessage, onError, onClose, onOpen);
        }, 5000);
      }
    };

    return this.websocket;
  } catch (error) {
    console.error('WebSocket connection error:', error);
    if (onError) onError(error);
    return null;
  }
}


    disconnectWebSocket() {
        if (this.websocket) {
            this.websocket.close(1000, 'Client disconnecting');
            this.websocket = null;
        }
    }

    getAllParameters() {
        return [
            'PM0.1', 'PM0.3', 'PM0.5', 'PM1.0', 'PM2.5', 'PM5.0', 'PM10',
            'PC0.1', 'PC0.3', 'PC0.5', 'PC1.0', 'PC2.5', 'PC5.0', 'PC10',
            'TEMP', 'HUMID', 'ATM',
            'VOCAQI', 'bVOCeq', 'GASest', 'CO2eq'
        ];
    }

    getParameterCategories() {
        return {
            'Feinstaub': ['PM0.1', 'PM0.3', 'PM0.5', 'PM1.0', 'PM2.5', 'PM5.0', 'PM10'],
            'Partikelanzahl': ['PC0.1', 'PC0.3', 'PC0.5', 'PC1.0', 'PC2.5', 'PC5.0', 'PC10'],
            'Umgebung': ['TEMP', 'HUMID', 'ATM'],
            'Gase': ['VOCAQI', 'bVOCeq', 'GASest', 'CO2eq']
        };
    }

    disconnect() {
        this.disconnectWebSocket();
    }
}

const airQualityAPI = new AirQualityAPI();

export default airQualityAPI;