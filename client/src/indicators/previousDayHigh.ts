import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousDayRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousDayHigh = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousDayRange();
  const dayCandles = filterCandlesInRange(candles, range);
  if (dayCandles.length === 0) return null;

  const value = Math.max(...dayCandles.map(c => c.high));
  const ref = dayCandles[0];
  return { id: 'PDH', label: 'PDH', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
