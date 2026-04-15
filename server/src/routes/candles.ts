import { Router } from 'express';
import { fetchCandles } from '../coinbase/client.js';

export const candlesRouter = Router();

candlesRouter.get('/', async (req, res) => {
  const { symbol, granularity, start, end } = req.query as Record<string, string>;

  if (!symbol || !granularity || !start || !end) {
    res.status(400).json({ error: 'symbol, granularity, start, and end are required' });
    return;
  }

  try {
    const candles = await fetchCandles(symbol, Number(granularity), start, end);
    res.json(candles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch candles from Coinbase' });
  }
});
