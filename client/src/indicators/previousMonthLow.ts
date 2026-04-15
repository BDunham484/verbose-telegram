import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousMonthRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousMonthLow = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousMonthRange();
  const monthCandles = filterCandlesInRange(candles, range);
  if (monthCandles.length === 0) return null;

  const value = Math.min(...monthCandles.map(c => c.low));
  const ref = monthCandles[0];
  return { id: 'PML', label: 'PML', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
