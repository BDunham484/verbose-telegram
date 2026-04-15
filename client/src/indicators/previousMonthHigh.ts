import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousMonthRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousMonthHigh = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousMonthRange();
  const monthCandles = filterCandlesInRange(candles, range);
  if (monthCandles.length === 0) return null;

  const value = Math.max(...monthCandles.map(c => c.high));
  const ref = monthCandles[0];
  return { id: 'PMH', label: 'PMH', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
