import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousDayRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousDayLow = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousDayRange();
  const dayCandles = filterCandlesInRange(candles, range);
  if (dayCandles.length === 0) return null;

  const value = Math.min(...dayCandles.map(c => c.low));
  const ref = dayCandles[0];
  return { id: 'PDL', label: 'PDL', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
