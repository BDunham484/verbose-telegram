import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousWeekRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousWeekHigh = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousWeekRange();
  const weekCandles = filterCandlesInRange(candles, range);
  if (weekCandles.length === 0) return null;

  const value = Math.max(...weekCandles.map(c => c.high));
  const ref = weekCandles[0];
  return { id: 'PWH', label: 'PWH', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
