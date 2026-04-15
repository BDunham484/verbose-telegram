import type { Candle } from '@shared/types/index.js';

export type TimeRange = { start: number; end: number };

export const getPreviousDayRange = (): TimeRange => {
  const now = new Date();
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = end - 86_400_000;
  return { start, end };
};

export const getPreviousWeekRange = (): TimeRange => {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayOfWeek = now.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisWeekStart = todayUTC - daysToMonday * 86_400_000;
  const lastWeekStart = thisWeekStart - 7 * 86_400_000;
  return { start: lastWeekStart, end: thisWeekStart };
};

export const getPreviousMonthRange = (): TimeRange => {
  const now = new Date();
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
  return { start, end };
};

export const getCurrentMondayRange = (): TimeRange => {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayOfWeek = now.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = todayUTC - daysToMonday * 86_400_000;
  const end = start + 86_400_000;
  return { start, end };
};

export const getSessionRange = (openUtcHour: number, closeUtcHour: number): TimeRange => {
  const now = new Date();
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return {
    start: dayStart + openUtcHour * 3_600_000,
    end: dayStart + closeUtcHour * 3_600_000,
  };
};

export const filterCandlesInRange = (candles: Candle[], range: TimeRange): Candle[] =>
  candles.filter(c => {
    const ms = c.time * 1000;
    return ms >= range.start && ms < range.end;
  });

export const toChicago = (utcTimestamp: number): string =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(utcTimestamp * 1000));
