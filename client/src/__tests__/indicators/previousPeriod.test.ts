import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Candle, SessionConfig } from '@shared/types/index.js';
import { previousDayHigh } from '../../indicators/previousDayHigh.js';
import { previousDayLow } from '../../indicators/previousDayLow.js';
import { previousWeekHigh } from '../../indicators/previousWeekHigh.js';
import { previousWeekLow } from '../../indicators/previousWeekLow.js';
import { previousMonthHigh } from '../../indicators/previousMonthHigh.js';
import { previousMonthLow } from '../../indicators/previousMonthLow.js';

// Fix "now" to Thursday 2026-04-16 10:00:00 UTC
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-04-16T10:00:00Z')); });
afterEach(() => { vi.useRealTimers(); });

const cfg: SessionConfig = {
  displayTimezone: 'America/Chicago',
  asiaOpenUtcHour: 0,
  asiaCloseUtcHour: 9,
  londonOpenUtcHour: 8,
  londonCloseUtcHour: 16,
};

const candle = (iso: string, high: number, low: number, open = 100, close = 100): Candle => ({
  time: new Date(iso).getTime() / 1000,
  open, high, low, close, volume: 1,
});

// Previous day = 2026-04-15
// Previous week = 2026-04-06 to 2026-04-12
// Previous month = March 2026

const candles: Candle[] = [
  candle('2026-03-15T12:00:00Z', 55000, 52000), // prev month
  candle('2026-04-08T12:00:00Z', 63000, 60000), // prev week
  candle('2026-04-15T06:00:00Z', 70000, 68000), // prev day candle 1
  candle('2026-04-15T14:00:00Z', 71500, 69000), // prev day candle 2 (highest high)
  candle('2026-04-16T06:00:00Z', 72000, 70000), // today — should be excluded
];

describe('previousDayHigh', () => {
  it('returns the max high from yesterday', () => {
    const level = previousDayHigh(candles, cfg);
    expect(level?.value).toBe(71500);
    expect(level?.id).toBe('PDH');
    expect(level?.color).toBe('#F59E0B');
  });
});

describe('previousDayLow', () => {
  it('returns the min low from yesterday', () => {
    const level = previousDayLow(candles, cfg);
    expect(level?.value).toBe(68000);
    expect(level?.id).toBe('PDL');
  });
});

describe('previousWeekHigh', () => {
  it('returns the max high from last week', () => {
    const level = previousWeekHigh(candles, cfg);
    expect(level?.value).toBe(63000);
    expect(level?.id).toBe('PWH');
  });
});

describe('previousWeekLow', () => {
  it('returns the min low from last week', () => {
    const level = previousWeekLow(candles, cfg);
    expect(level?.value).toBe(60000);
    expect(level?.id).toBe('PWL');
  });
});

describe('previousMonthHigh', () => {
  it('returns the max high from last month', () => {
    const level = previousMonthHigh(candles, cfg);
    expect(level?.value).toBe(55000);
    expect(level?.id).toBe('PMH');
  });
});

describe('previousMonthLow', () => {
  it('returns the min low from last month', () => {
    const level = previousMonthLow(candles, cfg);
    expect(level?.value).toBe(52000);
    expect(level?.id).toBe('PML');
  });
});

describe('returns null when no candles in range', () => {
  it('previousDayHigh returns null for empty candles', () => {
    expect(previousDayHigh([], cfg)).toBeNull();
  });
});
