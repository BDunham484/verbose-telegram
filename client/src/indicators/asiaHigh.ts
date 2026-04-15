import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const asiaHigh = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.asiaOpenUtcHour, config.asiaCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const value = Math.max(...sessionCandles.map(c => c.high));
  const ref = sessionCandles[0];
  return { id: 'ASIA_H', label: 'Asia H', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#3B82F6' };
};
