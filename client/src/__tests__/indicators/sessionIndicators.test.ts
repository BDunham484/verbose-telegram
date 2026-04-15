import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Candle, SessionConfig } from '@shared/types/index.js';
import { mondayHigh } from '../../indicators/mondayHigh.js';
import { dailyOpen } from '../../indicators/dailyOpen.js';
import { asiaOpen } from '../../indicators/asiaOpen.js';
import { asiaHigh } from '../../indicators/asiaHigh.js';
import { asiaLow } from '../../indicators/asiaLow.js';
import { londonOpen } from '../../indicators/londonOpen.js';
import { londonHigh } from '../../indicators/londonHigh.js';
import { londonLow } from '../../indicators/londonLow.js';

// Fix "now" to Thursday 2026-04-16 10:00:00 UTC
// Monday this week = 2026-04-13
// Asia session today = 2026-04-16 00:00–09:00 UTC
// London session today = 2026-04-16 08:00–16:00 UTC
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

const candles: Candle[] = [
  // Monday 2026-04-13 candles
  candle('2026-04-13T02:00:00Z', 68000, 66000, 67000, 67500), // Monday open
  candle('2026-04-13T10:00:00Z', 69500, 67000),               // Monday high
  // Today's Asia session: 2026-04-16 00:00–09:00 UTC
  candle('2026-04-16T00:00:00Z', 71000, 70000, 70500, 70800), // Asia open candle
  candle('2026-04-16T04:00:00Z', 72000, 70500),               // Asia high
  candle('2026-04-16T08:00:00Z', 71500, 69500, 71000, 71200), // Overlap: Asia + London open
  // London: 08:00–16:00 UTC
  candle('2026-04-16T10:00:00Z', 73000, 70000),               // London high
  // Outside all sessions
  candle('2026-04-15T15:00:00Z', 80000, 75000),               // Yesterday — excluded
];

describe('mondayHigh', () => {
  it('returns the max high from this Monday', () => {
    const level = mondayHigh(candles, cfg);
    expect(level?.value).toBe(69500);
    expect(level?.id).toBe('MON_H');
    expect(level?.color).toBe('#9CA3AF');
  });
});

describe('dailyOpen', () => {
  it('returns the open of the first candle today', () => {
    const level = dailyOpen(candles, cfg);
    expect(level?.value).toBe(70500);
    expect(level?.id).toBe('DO');
    expect(level?.color).toBe('#9CA3AF');
  });
});

describe('asiaOpen', () => {
  it('returns the open of the first Asia session candle', () => {
    const level = asiaOpen(candles, cfg);
    expect(level?.value).toBe(70500);
    expect(level?.id).toBe('ASIA_O');
    expect(level?.color).toBe('#3B82F6');
  });
});

describe('asiaHigh', () => {
  it('returns the max high in the Asia session', () => {
    const level = asiaHigh(candles, cfg);
    expect(level?.value).toBe(72000);
    expect(level?.id).toBe('ASIA_H');
  });
});

describe('asiaLow', () => {
  it('returns the min low in the Asia session', () => {
    const level = asiaLow(candles, cfg);
    expect(level?.value).toBe(69500);
    expect(level?.id).toBe('ASIA_L');
  });
});

describe('londonOpen', () => {
  it('returns the open of the first London session candle', () => {
    const level = londonOpen(candles, cfg);
    expect(level?.value).toBe(71000);
    expect(level?.id).toBe('LON_O');
    expect(level?.color).toBe('#A855F7');
  });
});

describe('londonHigh', () => {
  it('returns the max high in the London session', () => {
    const level = londonHigh(candles, cfg);
    expect(level?.value).toBe(73000);
    expect(level?.id).toBe('LON_H');
  });
});

describe('londonLow', () => {
  it('returns the min low in the London session', () => {
    const level = londonLow(candles, cfg);
    expect(level?.value).toBe(69500);
    expect(level?.id).toBe('LON_L');
  });
});
