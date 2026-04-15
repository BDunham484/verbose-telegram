import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const londonLow = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.londonOpenUtcHour, config.londonCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const value = Math.min(...sessionCandles.map(c => c.low));
  const ref = sessionCandles[0];
  return { id: 'LON_L', label: 'London L', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#A855F7' };
};
