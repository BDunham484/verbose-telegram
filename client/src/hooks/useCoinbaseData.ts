import { useState, useEffect, useRef } from 'react';
import type { Candle } from '@shared/types/index.js';

type Status = 'idle' | 'loading' | 'live' | 'stale' | 'error';

type CoinbaseDataResult = {
  intradayCandles: Candle[];
  dailyCandles: Candle[];
  status: Status;
};

const DAILY_GRANULARITY = 86400;
const POLL_INTERVAL_MS = 60_000;

const buildCandleUrl = (symbol: string, granularity: number, days: number): string => {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const params = new URLSearchParams({
    symbol,
    granularity: String(granularity),
    start: start.toISOString(),
    end: end.toISOString(),
  });
  return `/api/candles?${params}`;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
};

export const useCoinbaseData = (symbol: string, granularity: number): CoinbaseDataResult => {
  const [intradayCandles, setIntradayCandles] = useState<Candle[]>([]);
  const [dailyCandles, setDailyCandles] = useState<Candle[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = async () => {
    try {
      setStatus('loading');
      const intradayDays = Math.floor((300 * granularity) / 86_400);
      const [intraday, daily] = await Promise.all([
        fetchJson<Candle[]>(buildCandleUrl(symbol, granularity, intradayDays)),
        fetchJson<Candle[]>(buildCandleUrl(symbol, DAILY_GRANULARITY, 60)),
      ]);
      setIntradayCandles(intraday);
      setDailyCandles(daily);
      setStatus('live');
    } catch {
      setStatus(prev => (prev === 'live' ? 'stale' : 'error'));
    }
  };

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol, granularity]);

  return { intradayCandles, dailyCandles, status };
};
