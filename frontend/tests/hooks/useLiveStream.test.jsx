import { renderHook, act } from '@testing-library/react';

jest.mock('../../src/services/api', () => {
  let emitCb;
  return {
    fetchLiveData: jest.fn(async () => ({
      timestamp: '2025-01-01T00:00:00Z',
      measurements: { TEMP: 20 },
      air_quality_rating: { TEMP: { rating: 'GUT', value: 20 } },
      overall_quality: 'GUT'
    })),
    connectLive: jest.fn((onData, onState) => {
      onState && onState('OPEN');
      emitCb = () => onData({
        timestamp: '2025-01-01T00:00:01Z',
        measurements: { TEMP: 21 },
        air_quality_rating: { TEMP: { rating: 'GUT', value: 21 } },
        overall_quality: 'GUT'
      });
      return () => { emitCb = null; };
    }),
    __emit: () => emitCb && emitCb()
  };
});

import * as api from '../../src/services/api';
import { useLiveStream } from '../../src/hooks/useLiveStream';

describe('useLiveStream – simpel', () => {
  test('lädt und verarbeitet Update', async () => {
    const { result } = renderHook(() => useLiveStream(true));
    await act(async () => {});
    expect(result.current.live.measurements.TEMP).toBe(20);
    await act(async () => { api.__emit(); });
    expect(result.current.live.measurements.TEMP).toBe(21);
  });
});
