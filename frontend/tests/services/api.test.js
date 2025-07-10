// src/services/api.test.js
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { fetchLatestSensor, fetchSensorHistory } from './api';

describe('API Service', () => {
  const mock = new MockAdapter(axios);

  afterEach(() => mock.reset());

  it('fetchLatestSensor ruft /sensor/latest auf und gibt Daten zurück', async () => {
    const fake = { TEMP: 25, HUMID: 50, timestamp: 'xyz' };
    mock.onGet('http://localhost:5000/api/sensor/latest').reply(200, fake);

    const data = await fetchLatestSensor();
    expect(data).toEqual(fake);
  });

  it('fetchSensorHistory ruft /sensor/history auf und gibt Array zurück', async () => {
    const fakeArr = [{ timestamp: 'a' }, { timestamp: 'b' }];
    mock.onGet('http://localhost:5000/api/sensor/history').reply(200, fakeArr);

    const data = await fetchSensorHistory();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });
});
