import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const londonOpen = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.londonOpenUtcHour, config.londonCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const first = sessionCandles[0];
  return { id: 'LON_O', label: 'London Open', value: first.open, utcTime: first.time, displayTime: toChicago(first.time), color: '#A855F7' };
};
