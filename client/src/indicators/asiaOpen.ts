import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const asiaOpen = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.asiaOpenUtcHour, config.asiaCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const first = sessionCandles[0];
  return { id: 'ASIA_O', label: 'Asia Open', value: first.open, utcTime: first.time, displayTime: toChicago(first.time), color: '#3B82F6' };
};
