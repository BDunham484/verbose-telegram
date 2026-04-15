import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';

vi.mock('../../coinbase/client.js', () => ({
  fetchCandles: vi.fn().mockResolvedValue([
    { time: 1713225600, open: 60000, high: 61000, low: 59000, close: 60500, volume: 100 },
  ]),
}));

describe('GET /api/candles', () => {
  it('returns candles array', async () => {
    const res = await request(app)
      .get('/api/candles')
      .query({ symbol: 'BTC-USD', granularity: '3600', start: '2026-04-01T00:00:00Z', end: '2026-04-14T00:00:00Z' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ time: expect.any(Number), high: expect.any(Number) });
  });

  it('returns 400 when symbol is missing', async () => {
    const res = await request(app)
      .get('/api/candles')
      .query({ granularity: '3600' });

    expect(res.status).toBe(400);
  });
});
