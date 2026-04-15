import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPreviousDayRange,
  getPreviousWeekRange,
  getPreviousMonthRange,
  getCurrentMondayRange,
  getSessionRange,
  toChicago,
  filterCandlesInRange,
} from '../../indicators/utils.js';

const NOW_UTC = new Date('2026-04-16T10:00:00Z').getTime();

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW_UTC); });
afterEach(() => { vi.useRealTimers(); });

describe('getPreviousDayRange', () => {
  it('returns start/end UTC ms for yesterday', () => {
    const { start, end } = getPreviousDayRange();
    expect(start).toBe(new Date('2026-04-15T00:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-16T00:00:00Z').getTime());
  });
});

describe('getPreviousWeekRange', () => {
  it('returns Monday-to-Monday UTC ms for last week', () => {
    const { start, end } = getPreviousWeekRange();
    expect(start).toBe(new Date('2026-04-06T00:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-13T00:00:00Z').getTime());
  });
});

describe('getPreviousMonthRange', () => {
  it('returns first-of-month to first-of-month for last month', () => {
    const { start, end } = getPreviousMonthRange();
    expect(start).toBe(new Date('2026-03-01T00:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-01T00:00:00Z').getTime());
  });
});

describe('getCurrentMondayRange', () => {
  it('returns start/end UTC ms for this Monday', () => {
    const { start, end } = getCurrentMondayRange();
    expect(start).toBe(new Date('2026-04-13T00:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-14T00:00:00Z').getTime());
  });
});

describe('getSessionRange', () => {
  it('returns Asia session range for today', () => {
    const { start, end } = getSessionRange(0, 9);
    expect(start).toBe(new Date('2026-04-16T00:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-16T09:00:00Z').getTime());
  });

  it('returns London session range for today', () => {
    const { start, end } = getSessionRange(8, 16);
    expect(start).toBe(new Date('2026-04-16T08:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-16T16:00:00Z').getTime());
  });
});

describe('filterCandlesInRange', () => {
  it('includes candles within range and excludes those outside', () => {
    const candles = [
      { time: new Date('2026-04-15T06:00:00Z').getTime() / 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 1 },
      { time: new Date('2026-04-16T06:00:00Z').getTime() / 1000, open: 1, high: 3, low: 0.5, close: 2, volume: 1 },
    ];
    const range = getPreviousDayRange();
    const result = filterCandlesInRange(candles, range);
    expect(result).toHaveLength(1);
    expect(result[0].high).toBe(2);
  });
});

describe('toChicago', () => {
  it('returns a non-empty string', () => {
    const result = toChicago(NOW_UTC / 1000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
