import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const londonHigh = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.londonOpenUtcHour, config.londonCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const value = Math.max(...sessionCandles.map(c => c.high));
  const ref = sessionCandles[0];
  return { id: 'LON_H', label: 'London H', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#A855F7' };
};
