import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getCurrentMondayRange, filterCandlesInRange, toChicago } from './utils.js';

export const mondayHigh = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getCurrentMondayRange();
  const mondayCandles = filterCandlesInRange(candles, range);
  if (mondayCandles.length === 0) return null;

  const value = Math.max(...mondayCandles.map(c => c.high));
  const ref = mondayCandles[0];
  return { id: 'MON_H', label: 'Mon H', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#9CA3AF' };
};
