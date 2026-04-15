import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const dailyOpen = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(0, 24);
  const todayCandles = filterCandlesInRange(candles, range);
  if (todayCandles.length === 0) return null;

  const first = todayCandles[0];
  return { id: 'DO', label: 'Daily Open', value: first.open, utcTime: first.time, displayTime: toChicago(first.time), color: '#9CA3AF' };
};
