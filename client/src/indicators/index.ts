import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { previousDayHigh } from './previousDayHigh.js';
import { previousDayLow } from './previousDayLow.js';
import { previousWeekHigh } from './previousWeekHigh.js';
import { previousWeekLow } from './previousWeekLow.js';
import { previousMonthHigh } from './previousMonthHigh.js';
import { previousMonthLow } from './previousMonthLow.js';
import { mondayHigh } from './mondayHigh.js';
import { dailyOpen } from './dailyOpen.js';
import { asiaOpen } from './asiaOpen.js';
import { asiaHigh } from './asiaHigh.js';
import { asiaLow } from './asiaLow.js';
import { londonOpen } from './londonOpen.js';
import { londonHigh } from './londonHigh.js';
import { londonLow } from './londonLow.js';

// Previous period indicators use daily candles (longer history, less granularity)
const DAILY_INDICATORS = [
  previousDayHigh, previousDayLow,
  previousWeekHigh, previousWeekLow,
  previousMonthHigh, previousMonthLow,
  mondayHigh, dailyOpen,
];

// Session indicators use hourly candles (intraday granularity needed)
const INTRADAY_INDICATORS = [
  asiaOpen, asiaHigh, asiaLow,
  londonOpen, londonHigh, londonLow,
];

export const computeAllLevels = (
  dailyCandles: Candle[],
  intradayCandles: Candle[],
  config: SessionConfig,
): PriceLevel[] => {
  const levels: PriceLevel[] = [];

  for (const fn of DAILY_INDICATORS) {
    const level = fn(dailyCandles, config);
    if (level) levels.push(level);
  }

  for (const fn of INTRADAY_INDICATORS) {
    const level = fn(intradayCandles, config);
    if (level) levels.push(level);
  }

  return levels;
};
