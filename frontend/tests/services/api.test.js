// tests/services/api.test.js
import MockAdapter from 'axios-mock-adapter';
import { apiClient, fetchLatestSensor, fetchSensorHistory } from '../../src/services/api';

describe('API Service', () => {
  let mock;
  beforeAll(() => {
    mock = new MockAdapter(apiClient);
  });
  afterEach(() => mock.reset());
  afterAll(() => mock.restore());

  it('fetchLatestSensor ruft /sensor/latest und liefert Daten', async () => {
    const dummy = { TEMP: 22, HUMID: 55, timestamp: '2025-07-10T12:00:00Z' };
    mock.onGet('/sensor/latest').reply(200, dummy);

    const data = await fetchLatestSensor();
    expect(data).toEqual(dummy);
  });

  it('fetchSensorHistory ruft /sensor/history und liefert ein Array', async () => {
    const arr = [{ timestamp: 't1' }, { timestamp: 't2' }];
    mock.onGet('/sensor/history').reply(200, arr);

    const data = await fetchSensorHistory();
    expect(data).toEqual(arr);
  });
});
