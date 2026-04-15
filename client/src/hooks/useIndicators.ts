import { useMemo } from 'react';
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { computeAllLevels } from '../indicators/index.js';

export const useIndicators = (
  dailyCandles: Candle[],
  intradayCandles: Candle[],
  config: SessionConfig,
): PriceLevel[] =>
  useMemo(
    () => computeAllLevels(dailyCandles, intradayCandles, config),
    [dailyCandles, intradayCandles, config],
  );
