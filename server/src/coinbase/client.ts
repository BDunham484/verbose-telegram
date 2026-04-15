import type { Candle } from '../../../shared/types/index.js';

const BASE_URL = 'https://api.exchange.coinbase.com';

export const fetchCandles = async (
  symbol: string,
  granularity: number,
  start: string,
  end: string,
): Promise<Candle[]> => {
  const url = new URL(`${BASE_URL}/products/${symbol}/candles`);
  url.searchParams.set('granularity', String(granularity));
  url.searchParams.set('start', start);
  url.searchParams.set('end', end);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Coinbase API error: ${response.status}`);

  const raw = await response.json() as [number, number, number, number, number, number][];

  return raw
    .map(([time, low, high, open, close, volume]) => ({ time, open, high, low, close, volume }))
    .sort((a, b) => a.time - b.time);
};
