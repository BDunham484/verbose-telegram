import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const asiaLow = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.asiaOpenUtcHour, config.asiaCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const value = Math.min(...sessionCandles.map(c => c.low));
  const ref = sessionCandles[0];
  return { id: 'ASIA_L', label: 'Asia L', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#3B82F6' };
};
