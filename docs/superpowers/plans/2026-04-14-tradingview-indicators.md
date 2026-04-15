# TradingView Key Levels Indicator Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + Express monorepo that previews session-based key level indicators on a Lightweight Chart, fetches OHLCV data from Coinbase, and generates copy-pasteable Pine Script v5 for TradingView.

**Architecture:** npm workspaces monorepo with `client/` (React + Vite), `server/` (Express + TypeScript), and `shared/` (types only). The server proxies Coinbase REST API calls; all indicator logic lives in the client as pure TypeScript arrow functions. Vite's dev proxy routes `/api/*` to Express so the client sees one origin in development.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Express 4, TradingView Lightweight Charts v4, Vitest, npm workspaces, tsx (server dev runner)

**Code style:** All functions use arrow function syntax throughout — no `function` declarations.

---

## File Map

```
verbose-telegram/
├── package.json                              Root workspace + concurrently scripts
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts                        Proxy /api/* → :3001, @shared alias
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── config.ts                         DEFAULT_SESSION_CONFIG
│       ├── components/
│       │   ├── Chart.tsx                     Lightweight Charts wrapper + price lines
│       │   ├── Header.tsx                    Symbol/timeframe selects + Sessions button
│       │   ├── SessionsPanel.tsx             UTC→Chicago reference drawer
│       │   └── PineExport.tsx               Generated Pine Script + copy button
│       ├── indicators/
│       │   ├── utils.ts                      Session boundary helpers + toChicago
│       │   ├── previousDayHigh.ts
│       │   ├── previousDayLow.ts
│       │   ├── previousWeekHigh.ts
│       │   ├── previousWeekLow.ts
│       │   ├── previousMonthHigh.ts
│       │   ├── previousMonthLow.ts
│       │   ├── mondayHigh.ts
│       │   ├── dailyOpen.ts
│       │   ├── asiaOpen.ts
│       │   ├── asiaHigh.ts
│       │   ├── asiaLow.ts
│       │   ├── londonOpen.ts
│       │   ├── londonHigh.ts
│       │   ├── londonLow.ts
│       │   └── index.ts                      Aggregates all IndicatorFn[]
│       ├── pine/
│       │   └── generator.ts                  SessionConfig → Pine Script v5 string
│       └── hooks/
│           ├── useCoinbaseData.ts            Fetches hourly + daily candles
│           └── useIndicators.ts              Computes PriceLevel[] from candles
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts                            Express app (exported for testing)
│       ├── index.ts                          Calls app.listen()
│       ├── routes/
│       │   └── candles.ts                   GET /api/candles
│       └── coinbase/
│           └── client.ts                    fetchCandles() — Coinbase REST proxy
└── shared/
    ├── package.json
    └── types/
        └── index.ts                          Candle, PriceLevel, SessionConfig
```

---

## Task 1: Monorepo Scaffold + Shared Types

**Files:**
- Create: `package.json`
- Create: `shared/package.json`
- Create: `shared/types/index.ts`

- [ ] **Step 1: Write the root package.json**

```json
{
  "name": "verbose-telegram",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["client", "server", "shared"],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=server\" \"npm run dev --workspace=client\"",
    "test": "npm run test --workspace=client && npm run test --workspace=server"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: Write shared/package.json**

```json
{
  "name": "@verbose-telegram/shared",
  "version": "1.0.0",
  "exports": {
    ".": "./types/index.ts"
  }
}
```

- [ ] **Step 3: Write shared/types/index.ts**

```typescript
export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PriceLevel = {
  id: string;
  label: string;
  value: number;
  utcTime: number;
  displayTime: string;
  color: string;
};

export type SessionConfig = {
  displayTimezone: 'America/Chicago';
  asiaOpenUtcHour: number;
  asiaCloseUtcHour: number;
  londonOpenUtcHour: number;
  londonCloseUtcHour: number;
};
```

Note: `asiaCloseUtcHour` and `londonCloseUtcHour` are added here (not in the spec) because computing Asia High/Low and London High/Low requires knowing when each session ends.

- [ ] **Step 4: Install root dev dependency**

Run: `npm install`

Expected: `node_modules/` created, `concurrently` installed.

- [ ] **Step 5: Commit**

```bash
git add package.json shared/
git commit -m "feat: monorepo scaffold + shared types"
```

---

## Task 2: Express Server Scaffold

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/app.ts`
- Create: `server/src/index.ts`

- [ ] **Step 1: Write server/package.json**

```json
{
  "name": "@verbose-telegram/server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.7",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "tsx": "^4.7.3",
    "typescript": "^5.4.5",
    "vitest": "^1.5.0"
  }
}
```

- [ ] **Step 2: Write server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write server/src/app.ts**

```typescript
import express from 'express';
import cors from 'cors';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
```

- [ ] **Step 4: Write server/src/index.ts**

```typescript
import { app } from './app.js';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 5: Install server dependencies**

Run: `npm install --workspace=server`

Expected: `server/node_modules/` created.

- [ ] **Step 6: Verify server starts**

Run: `npm run dev --workspace=server`

Expected: `Server running on http://localhost:3001`

Stop with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add server/
git commit -m "feat: express server scaffold with health check"
```

---

## Task 3: Coinbase REST Client + Candles Route + Tests

**Files:**
- Create: `server/src/coinbase/client.ts`
- Create: `server/src/routes/candles.ts`
- Modify: `server/src/app.ts`

- [x] **Step 1: Write the failing test for the candles route**

Create `server/src/__tests__/routes/candles.test.ts`:

```typescript
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
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=server`

Expected: FAIL — `Cannot find module '../../coinbase/client.js'`

- [x] **Step 3: Write server/src/coinbase/client.ts**

```typescript
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
```

- [x] **Step 4: Write server/src/routes/candles.ts**

```typescript
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
```

- [x] **Step 5: Register the route in server/src/app.ts**

```typescript
import express from 'express';
import cors from 'cors';
import { candlesRouter } from './routes/candles.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/candles', candlesRouter);
```

- [x] **Step 6: Run tests to verify they pass**

Run: `npm run test --workspace=server`

Expected: PASS (2 tests)

- [x] **Step 7: Commit**

```bash
git add server/src/
git commit -m "feat: coinbase REST client + candles route"
```

---

## Task 4: Vite + React Client Scaffold

**Files:**
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/config.ts`

- [ ] **Step 1: Write client/package.json**

```json
{
  "name": "@verbose-telegram/client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "lightweight-charts": "^4.1.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.79",
    "@types/react-dom": "^18.2.25",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.4.5",
    "vite": "^5.2.8",
    "vitest": "^1.5.0"
  }
}
```

- [ ] **Step 2: Write client/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write client/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: Write client/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Key Levels</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0d1117; color: #e6edf3; font-family: system-ui, sans-serif; }
      #root { display: flex; flex-direction: column; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write client/src/main.tsx**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: Write client/src/config.ts**

```typescript
import type { SessionConfig } from '@shared/types/index.js';

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  displayTimezone: 'America/Chicago',
  asiaOpenUtcHour: 0,
  asiaCloseUtcHour: 9,
  londonOpenUtcHour: 8,
  londonCloseUtcHour: 16,
};

export const SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

export const GRANULARITIES: { label: string; value: number }[] = [
  { label: '1H', value: 3600 },
  { label: '4H', value: 14400 },
  { label: '1D', value: 86400 },
];
```

- [ ] **Step 7: Write client/src/App.tsx (skeleton — will be completed in Task 13)**

```typescript
export const App = () => (
  <div style={{ padding: '2rem', color: '#e6edf3' }}>
    <h1>Key Levels</h1>
    <p>Loading...</p>
  </div>
);
```

- [ ] **Step 8: Install client dependencies**

Run: `npm install --workspace=client`

Expected: `client/node_modules/` created.

- [ ] **Step 9: Verify client dev server starts**

Run: `npm run dev --workspace=client`

Expected: Vite dev server at `http://localhost:5173`. Open in browser — see "Key Levels / Loading..."

Stop with Ctrl+C.

- [ ] **Step 10: Commit**

```bash
git add client/
git commit -m "feat: vite react client scaffold"
```

---

## Task 5: Indicator Utilities + Tests

**Files:**
- Create: `client/src/indicators/utils.ts`
- Create: `client/src/__tests__/indicators/utils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `client/src/__tests__/indicators/utils.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPreviousDayRange,
  getPreviousWeekRange,
  getPreviousMonthRange,
  getCurrentMondayRange,
  getSessionRange,
  toChicago,
  filterCandlesInRange,
} from '../../indicators/utils.js';

// Fix "now" to Thursday 2026-04-16 10:00:00 UTC
const NOW_UTC = new Date('2026-04-16T10:00:00Z').getTime();

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW_UTC); });
afterEach(() => { vi.useRealTimers(); });

describe('getPreviousDayRange', () => {
  it('returns start/end UTC ms for yesterday', () => {
    const { start, end } = getPreviousDayRange();
    expect(start).toBe(new Date('2026-04-15T00:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-16T00:00:00Z').getTime());
  });
});

describe('getPreviousWeekRange', () => {
  it('returns Monday-to-Monday UTC ms for last week', () => {
    const { start, end } = getPreviousWeekRange();
    expect(start).toBe(new Date('2026-04-06T00:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-13T00:00:00Z').getTime());
  });
});

describe('getPreviousMonthRange', () => {
  it('returns first-of-month to first-of-month for last month', () => {
    const { start, end } = getPreviousMonthRange();
    expect(start).toBe(new Date('2026-03-01T00:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-01T00:00:00Z').getTime());
  });
});

describe('getCurrentMondayRange', () => {
  it('returns start/end UTC ms for this Monday', () => {
    const { start, end } = getCurrentMondayRange();
    expect(start).toBe(new Date('2026-04-13T00:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-14T00:00:00Z').getTime());
  });
});

describe('getSessionRange', () => {
  it('returns Asia session range for today', () => {
    const { start, end } = getSessionRange(0, 9);
    expect(start).toBe(new Date('2026-04-16T00:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-16T09:00:00Z').getTime());
  });

  it('returns London session range for today', () => {
    const { start, end } = getSessionRange(8, 16);
    expect(start).toBe(new Date('2026-04-16T08:00:00Z').getTime());
    expect(end).toBe(new Date('2026-04-16T16:00:00Z').getTime());
  });
});

describe('filterCandlesInRange', () => {
  it('includes candles within range and excludes those outside', () => {
    const candles = [
      { time: new Date('2026-04-15T06:00:00Z').getTime() / 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 1 },
      { time: new Date('2026-04-16T06:00:00Z').getTime() / 1000, open: 1, high: 3, low: 0.5, close: 2, volume: 1 },
    ];
    const range = getPreviousDayRange();
    const result = filterCandlesInRange(candles, range);
    expect(result).toHaveLength(1);
    expect(result[0].high).toBe(2);
  });
});

describe('toChicago', () => {
  it('returns a non-empty string', () => {
    const result = toChicago(NOW_UTC / 1000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace=client`

Expected: FAIL — `Cannot find module '../../indicators/utils.js'`

- [ ] **Step 3: Write client/src/indicators/utils.ts**

```typescript
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
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon...
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test --workspace=client`

Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/indicators/utils.ts client/src/__tests__/
git commit -m "feat: indicator utility functions + tests"
```

---

## Task 6: Previous Period Indicators + Tests

**Files:**
- Create: `client/src/indicators/previousDayHigh.ts`
- Create: `client/src/indicators/previousDayLow.ts`
- Create: `client/src/indicators/previousWeekHigh.ts`
- Create: `client/src/indicators/previousWeekLow.ts`
- Create: `client/src/indicators/previousMonthHigh.ts`
- Create: `client/src/indicators/previousMonthLow.ts`
- Create: `client/src/__tests__/indicators/previousPeriod.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `client/src/__tests__/indicators/previousPeriod.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Candle, SessionConfig } from '@shared/types/index.js';
import { previousDayHigh } from '../../indicators/previousDayHigh.js';
import { previousDayLow } from '../../indicators/previousDayLow.js';
import { previousWeekHigh } from '../../indicators/previousWeekHigh.js';
import { previousWeekLow } from '../../indicators/previousWeekLow.js';
import { previousMonthHigh } from '../../indicators/previousMonthHigh.js';
import { previousMonthLow } from '../../indicators/previousMonthLow.js';

// Fix "now" to Thursday 2026-04-16 10:00:00 UTC
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-04-16T10:00:00Z')); });
afterEach(() => { vi.useRealTimers(); });

const cfg: SessionConfig = {
  displayTimezone: 'America/Chicago',
  asiaOpenUtcHour: 0,
  asiaCloseUtcHour: 9,
  londonOpenUtcHour: 8,
  londonCloseUtcHour: 16,
};

const candle = (iso: string, high: number, low: number, open = 100, close = 100): Candle => ({
  time: new Date(iso).getTime() / 1000,
  open, high, low, close, volume: 1,
});

// Previous day = 2026-04-15
// Previous week = 2026-04-06 to 2026-04-12
// Previous month = March 2026

const candles: Candle[] = [
  candle('2026-03-15T12:00:00Z', 55000, 52000), // prev month
  candle('2026-04-08T12:00:00Z', 63000, 60000), // prev week
  candle('2026-04-15T06:00:00Z', 70000, 68000), // prev day candle 1
  candle('2026-04-15T14:00:00Z', 71500, 69000), // prev day candle 2 (highest high)
  candle('2026-04-16T06:00:00Z', 72000, 70000), // today — should be excluded
];

describe('previousDayHigh', () => {
  it('returns the max high from yesterday', () => {
    const level = previousDayHigh(candles, cfg);
    expect(level?.value).toBe(71500);
    expect(level?.id).toBe('PDH');
    expect(level?.color).toBe('#F59E0B');
  });
});

describe('previousDayLow', () => {
  it('returns the min low from yesterday', () => {
    const level = previousDayLow(candles, cfg);
    expect(level?.value).toBe(68000);
    expect(level?.id).toBe('PDL');
  });
});

describe('previousWeekHigh', () => {
  it('returns the max high from last week', () => {
    const level = previousWeekHigh(candles, cfg);
    expect(level?.value).toBe(63000);
    expect(level?.id).toBe('PWH');
  });
});

describe('previousWeekLow', () => {
  it('returns the min low from last week', () => {
    const level = previousWeekLow(candles, cfg);
    expect(level?.value).toBe(60000);
    expect(level?.id).toBe('PWL');
  });
});

describe('previousMonthHigh', () => {
  it('returns the max high from last month', () => {
    const level = previousMonthHigh(candles, cfg);
    expect(level?.value).toBe(55000);
    expect(level?.id).toBe('PMH');
  });
});

describe('previousMonthLow', () => {
  it('returns the min low from last month', () => {
    const level = previousMonthLow(candles, cfg);
    expect(level?.value).toBe(52000);
    expect(level?.id).toBe('PML');
  });
});

describe('returns null when no candles in range', () => {
  it('previousDayHigh returns null for empty candles', () => {
    expect(previousDayHigh([], cfg)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace=client`

Expected: FAIL — `Cannot find module '../../indicators/previousDayHigh.js'`

- [ ] **Step 3: Write client/src/indicators/previousDayHigh.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousDayRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousDayHigh = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousDayRange();
  const dayCandles = filterCandlesInRange(candles, range);
  if (dayCandles.length === 0) return null;

  const value = Math.max(...dayCandles.map(c => c.high));
  const ref = dayCandles[0];
  return { id: 'PDH', label: 'PDH', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
```

- [ ] **Step 4: Write client/src/indicators/previousDayLow.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousDayRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousDayLow = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousDayRange();
  const dayCandles = filterCandlesInRange(candles, range);
  if (dayCandles.length === 0) return null;

  const value = Math.min(...dayCandles.map(c => c.low));
  const ref = dayCandles[0];
  return { id: 'PDL', label: 'PDL', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
```

- [ ] **Step 5: Write client/src/indicators/previousWeekHigh.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousWeekRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousWeekHigh = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousWeekRange();
  const weekCandles = filterCandlesInRange(candles, range);
  if (weekCandles.length === 0) return null;

  const value = Math.max(...weekCandles.map(c => c.high));
  const ref = weekCandles[0];
  return { id: 'PWH', label: 'PWH', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
```

- [ ] **Step 6: Write client/src/indicators/previousWeekLow.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousWeekRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousWeekLow = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousWeekRange();
  const weekCandles = filterCandlesInRange(candles, range);
  if (weekCandles.length === 0) return null;

  const value = Math.min(...weekCandles.map(c => c.low));
  const ref = weekCandles[0];
  return { id: 'PWL', label: 'PWL', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
```

- [ ] **Step 7: Write client/src/indicators/previousMonthHigh.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousMonthRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousMonthHigh = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousMonthRange();
  const monthCandles = filterCandlesInRange(candles, range);
  if (monthCandles.length === 0) return null;

  const value = Math.max(...monthCandles.map(c => c.high));
  const ref = monthCandles[0];
  return { id: 'PMH', label: 'PMH', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
```

- [ ] **Step 8: Write client/src/indicators/previousMonthLow.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getPreviousMonthRange, filterCandlesInRange, toChicago } from './utils.js';

export const previousMonthLow = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getPreviousMonthRange();
  const monthCandles = filterCandlesInRange(candles, range);
  if (monthCandles.length === 0) return null;

  const value = Math.min(...monthCandles.map(c => c.low));
  const ref = monthCandles[0];
  return { id: 'PML', label: 'PML', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#F59E0B' };
};
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm run test --workspace=client`

Expected: PASS (all tests including previous 7)

- [ ] **Step 10: Commit**

```bash
git add client/src/indicators/
git commit -m "feat: previous period indicators (PDH, PDL, PWH, PWL, PMH, PML)"
```

---

## Task 7: Session Indicators + Tests

**Files:**
- Create: `client/src/indicators/mondayHigh.ts`
- Create: `client/src/indicators/dailyOpen.ts`
- Create: `client/src/indicators/asiaOpen.ts`
- Create: `client/src/indicators/asiaHigh.ts`
- Create: `client/src/indicators/asiaLow.ts`
- Create: `client/src/indicators/londonOpen.ts`
- Create: `client/src/indicators/londonHigh.ts`
- Create: `client/src/indicators/londonLow.ts`
- Create: `client/src/__tests__/indicators/sessionIndicators.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `client/src/__tests__/indicators/sessionIndicators.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Candle, SessionConfig } from '@shared/types/index.js';
import { mondayHigh } from '../../indicators/mondayHigh.js';
import { dailyOpen } from '../../indicators/dailyOpen.js';
import { asiaOpen } from '../../indicators/asiaOpen.js';
import { asiaHigh } from '../../indicators/asiaHigh.js';
import { asiaLow } from '../../indicators/asiaLow.js';
import { londonOpen } from '../../indicators/londonOpen.js';
import { londonHigh } from '../../indicators/londonHigh.js';
import { londonLow } from '../../indicators/londonLow.js';

// Fix "now" to Thursday 2026-04-16 10:00:00 UTC
// Monday this week = 2026-04-13
// Asia session today = 2026-04-16 00:00–09:00 UTC
// London session today = 2026-04-16 08:00–16:00 UTC
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-04-16T10:00:00Z')); });
afterEach(() => { vi.useRealTimers(); });

const cfg: SessionConfig = {
  displayTimezone: 'America/Chicago',
  asiaOpenUtcHour: 0,
  asiaCloseUtcHour: 9,
  londonOpenUtcHour: 8,
  londonCloseUtcHour: 16,
};

const candle = (iso: string, high: number, low: number, open = 100, close = 100): Candle => ({
  time: new Date(iso).getTime() / 1000,
  open, high, low, close, volume: 1,
});

const candles: Candle[] = [
  // Monday 2026-04-13 candles
  candle('2026-04-13T02:00:00Z', 68000, 66000, 67000, 67500), // Monday open
  candle('2026-04-13T10:00:00Z', 69500, 67000),               // Monday high
  // Today's Asia session: 2026-04-16 00:00–09:00 UTC
  candle('2026-04-16T00:00:00Z', 71000, 70000, 70500, 70800), // Asia open candle
  candle('2026-04-16T04:00:00Z', 72000, 70500),               // Asia high
  candle('2026-04-16T08:00:00Z', 71500, 69500, 71000, 71200), // Overlap: Asia + London open
  // London: 08:00–16:00 UTC
  candle('2026-04-16T10:00:00Z', 73000, 70000),               // London high
  // Outside all sessions
  candle('2026-04-15T15:00:00Z', 80000, 75000),               // Yesterday — excluded
];

describe('mondayHigh', () => {
  it('returns the max high from this Monday', () => {
    const level = mondayHigh(candles, cfg);
    expect(level?.value).toBe(69500);
    expect(level?.id).toBe('MON_H');
    expect(level?.color).toBe('#9CA3AF');
  });
});

describe('dailyOpen', () => {
  it('returns the open of the first candle today', () => {
    const level = dailyOpen(candles, cfg);
    expect(level?.value).toBe(70500);
    expect(level?.id).toBe('DO');
    expect(level?.color).toBe('#9CA3AF');
  });
});

describe('asiaOpen', () => {
  it('returns the open of the first Asia session candle', () => {
    const level = asiaOpen(candles, cfg);
    expect(level?.value).toBe(70500);
    expect(level?.id).toBe('ASIA_O');
    expect(level?.color).toBe('#3B82F6');
  });
});

describe('asiaHigh', () => {
  it('returns the max high in the Asia session', () => {
    const level = asiaHigh(candles, cfg);
    expect(level?.value).toBe(72000);
    expect(level?.id).toBe('ASIA_H');
  });
});

describe('asiaLow', () => {
  it('returns the min low in the Asia session', () => {
    const level = asiaLow(candles, cfg);
    expect(level?.value).toBe(69500);
    expect(level?.id).toBe('ASIA_L');
  });
});

describe('londonOpen', () => {
  it('returns the open of the first London session candle', () => {
    const level = londonOpen(candles, cfg);
    expect(level?.value).toBe(71000);
    expect(level?.id).toBe('LON_O');
    expect(level?.color).toBe('#A855F7');
  });
});

describe('londonHigh', () => {
  it('returns the max high in the London session', () => {
    const level = londonHigh(candles, cfg);
    expect(level?.value).toBe(73000);
    expect(level?.id).toBe('LON_H');
  });
});

describe('londonLow', () => {
  it('returns the min low in the London session', () => {
    const level = londonLow(candles, cfg);
    expect(level?.value).toBe(69500);
    expect(level?.id).toBe('LON_L');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace=client`

Expected: FAIL — `Cannot find module '../../indicators/mondayHigh.js'`

- [ ] **Step 3: Write client/src/indicators/mondayHigh.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getCurrentMondayRange, filterCandlesInRange, toChicago } from './utils.js';

export const mondayHigh = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getCurrentMondayRange();
  const mondayCandles = filterCandlesInRange(candles, range);
  if (mondayCandles.length === 0) return null;

  const value = Math.max(...mondayCandles.map(c => c.high));
  const ref = mondayCandles[0];
  return { id: 'MON_H', label: 'Mon H', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#9CA3AF' };
};
```

- [ ] **Step 4: Write client/src/indicators/dailyOpen.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const dailyOpen = (candles: Candle[], _config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(0, 24);
  const todayCandles = filterCandlesInRange(candles, range);
  if (todayCandles.length === 0) return null;

  const first = todayCandles[0];
  return { id: 'DO', label: 'Daily Open', value: first.open, utcTime: first.time, displayTime: toChicago(first.time), color: '#9CA3AF' };
};
```

- [ ] **Step 5: Write client/src/indicators/asiaOpen.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const asiaOpen = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.asiaOpenUtcHour, config.asiaCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const first = sessionCandles[0];
  return { id: 'ASIA_O', label: 'Asia Open', value: first.open, utcTime: first.time, displayTime: toChicago(first.time), color: '#3B82F6' };
};
```

- [ ] **Step 6: Write client/src/indicators/asiaHigh.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const asiaHigh = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.asiaOpenUtcHour, config.asiaCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const value = Math.max(...sessionCandles.map(c => c.high));
  const ref = sessionCandles[0];
  return { id: 'ASIA_H', label: 'Asia H', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#3B82F6' };
};
```

- [ ] **Step 7: Write client/src/indicators/asiaLow.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const asiaLow = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.asiaOpenUtcHour, config.asiaCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const value = Math.min(...sessionCandles.map(c => c.low));
  const ref = sessionCandles[0];
  return { id: 'ASIA_L', label: 'Asia L', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#3B82F6' };
};
```

- [ ] **Step 8: Write client/src/indicators/londonOpen.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const londonOpen = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.londonOpenUtcHour, config.londonCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const first = sessionCandles[0];
  return { id: 'LON_O', label: 'London Open', value: first.open, utcTime: first.time, displayTime: toChicago(first.time), color: '#A855F7' };
};
```

- [ ] **Step 9: Write client/src/indicators/londonHigh.ts**

```typescript
import type { Candle, PriceLevel, SessionConfig } from '@shared/types/index.js';
import { getSessionRange, filterCandlesInRange, toChicago } from './utils.js';

export const londonHigh = (candles: Candle[], config: SessionConfig): PriceLevel | null => {
  const range = getSessionRange(config.londonOpenUtcHour, config.londonCloseUtcHour);
  const sessionCandles = filterCandlesInRange(candles, range);
  if (sessionCandles.length === 0) return null;

  const value = Math.max(...sessionCandles.map(c => c.high));
  const ref = sessionCandles[0];
  return { id: 'LON_H', label: 'London H', value, utcTime: ref.time, displayTime: toChicago(ref.time), color: '#A855F7' };
};
```

- [ ] **Step 10: Write client/src/indicators/londonLow.ts**

```typescript
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
```

- [ ] **Step 11: Run tests to verify they pass**

Run: `npm run test --workspace=client`

Expected: PASS (all tests)

- [ ] **Step 12: Commit**

```bash
git add client/src/indicators/
git commit -m "feat: session indicators (Monday High, Daily/Asia/London opens, highs, lows)"
```

---

## Task 8: Indicator Aggregator + useIndicators Hook

**Files:**
- Create: `client/src/indicators/index.ts`
- Create: `client/src/hooks/useIndicators.ts`

- [ ] **Step 1: Write client/src/indicators/index.ts**

```typescript
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
```

- [ ] **Step 2: Write client/src/hooks/useIndicators.ts**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add client/src/indicators/index.ts client/src/hooks/useIndicators.ts
git commit -m "feat: indicator aggregator + useIndicators hook"
```

---

## Task 9: Pine Script Generator + Snapshot Test

**Files:**
- Create: `client/src/pine/generator.ts`
- Create: `client/src/__tests__/pine/generator.test.ts`

- [ ] **Step 1: Write the failing snapshot test**

Create `client/src/__tests__/pine/generator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generatePineScript } from '../../pine/generator.js';
import type { SessionConfig } from '@shared/types/index.js';

const cfg: SessionConfig = {
  displayTimezone: 'America/Chicago',
  asiaOpenUtcHour: 0,
  asiaCloseUtcHour: 9,
  londonOpenUtcHour: 8,
  londonCloseUtcHour: 16,
};

describe('generatePineScript', () => {
  it('produces a valid Pine Script v5 indicator (snapshot)', () => {
    const script = generatePineScript(cfg);
    expect(script).toMatchSnapshot();
  });

  it('starts with //@version=5', () => {
    expect(generatePineScript(cfg)).toMatch(/^\/\/@version=5/);
  });

  it('includes all 14 indicator IDs', () => {
    const script = generatePineScript(cfg);
    const ids = ['PDH', 'PDL', 'PWH', 'PWL', 'PMH', 'PML', 'MON_H', 'DO',
                 'ASIA_O', 'ASIA_H', 'ASIA_L', 'LON_O', 'LON_H', 'LON_L'];
    for (const id of ids) {
      expect(script).toContain(id);
    }
  });

  it('uses the configured Asia session hours', () => {
    const custom: SessionConfig = { ...cfg, asiaOpenUtcHour: 1, asiaCloseUtcHour: 10 };
    const script = generatePineScript(custom);
    expect(script).toContain('0100-1000');
  });

  it('uses the configured London session hours', () => {
    const custom: SessionConfig = { ...cfg, londonOpenUtcHour: 7, londonCloseUtcHour: 15 };
    const script = generatePineScript(custom);
    expect(script).toContain('0700-1500');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace=client`

Expected: FAIL — `Cannot find module '../../pine/generator.js'`

- [ ] **Step 3: Write client/src/pine/generator.ts**

```typescript
import type { SessionConfig } from '@shared/types/index.js';

const padHour = (h: number): string => String(h).padStart(2, '0');

const sessionTime = (openHour: number, closeHour: number): string =>
  `${padHour(openHour)}00-${padHour(closeHour)}00`;

export const generatePineScript = (config: SessionConfig): string => {
  const asiaTime = sessionTime(config.asiaOpenUtcHour, config.asiaCloseUtcHour);
  const londonTime = sessionTime(config.londonOpenUtcHour, config.londonCloseUtcHour);

  return `//@version=5
indicator("Key Levels", overlay=true, max_lines_count=20)

// ─── Previous Period Levels ────────────────────────────────────────────
PDH  = request.security(syminfo.tickerid, "D", high[1],  lookahead=barmerge.lookahead_on)
PDL  = request.security(syminfo.tickerid, "D", low[1],   lookahead=barmerge.lookahead_on)
PWH  = request.security(syminfo.tickerid, "W", high[1],  lookahead=barmerge.lookahead_on)
PWL  = request.security(syminfo.tickerid, "W", low[1],   lookahead=barmerge.lookahead_on)
PMH  = request.security(syminfo.tickerid, "M", high[1],  lookahead=barmerge.lookahead_on)
PML  = request.security(syminfo.tickerid, "M", low[1],   lookahead=barmerge.lookahead_on)
DO   = request.security(syminfo.tickerid, "D", open,     lookahead=barmerge.lookahead_on)

plot(PDH, "PDH",  color=color.new(color.orange, 0),  linewidth=1, style=plot.style_line)
plot(PDL, "PDL",  color=color.new(color.orange, 0),  linewidth=1, style=plot.style_line)
plot(PWH, "PWH",  color=color.new(color.orange, 30), linewidth=1, style=plot.style_line)
plot(PWL, "PWL",  color=color.new(color.orange, 30), linewidth=1, style=plot.style_line)
plot(PMH, "PMH",  color=color.new(color.orange, 60), linewidth=1, style=plot.style_line)
plot(PML, "PML",  color=color.new(color.orange, 60), linewidth=1, style=plot.style_line)
plot(DO,  "DO",   color=color.new(color.gray,   30), linewidth=1, style=plot.style_line)

// ─── Monday High ───────────────────────────────────────────────────────
var float MON_H = na
if dayofweek == dayofweek.monday
    MON_H := high
plot(MON_H, "Mon H", color=color.new(color.gray, 0), linewidth=1, style=plot.style_line)

// ─── Asia Session (${asiaTime} UTC) ───────────────────────────────────
asiaSession = not na(time(timeframe.period, "${asiaTime}:1234567", "UTC"))
var float ASIA_O = na
var float ASIA_H = na
var float ASIA_L = na
if asiaSession and not asiaSession[1]
    ASIA_O := open
    ASIA_H := high
    ASIA_L := low
if asiaSession
    ASIA_H := math.max(nz(ASIA_H, high), high)
    ASIA_L := math.min(nz(ASIA_L, low), low)

plot(ASIA_O, "ASIA_O", color=color.new(color.blue, 0),  linewidth=1, style=plot.style_line)
plot(ASIA_H, "ASIA_H", color=color.new(color.blue, 30), linewidth=1, style=plot.style_line)
plot(ASIA_L, "ASIA_L", color=color.new(color.blue, 30), linewidth=1, style=plot.style_line)

// ─── London Session (${londonTime} UTC) ──────────────────────────────
londonSession = not na(time(timeframe.period, "${londonTime}:1234567", "UTC"))
var float LON_O = na
var float LON_H = na
var float LON_L = na
if londonSession and not londonSession[1]
    LON_O := open
    LON_H := high
    LON_L := low
if londonSession
    LON_H := math.max(nz(LON_H, high), high)
    LON_L := math.min(nz(LON_L, low), low)

plot(LON_O, "LON_O", color=color.new(color.purple, 0),  linewidth=1, style=plot.style_line)
plot(LON_H, "LON_H", color=color.new(color.purple, 30), linewidth=1, style=plot.style_line)
plot(LON_L, "LON_L", color=color.new(color.purple, 30), linewidth=1, style=plot.style_line)
`.trimStart();
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test --workspace=client`

Expected: PASS — snapshot file created at `client/src/__tests__/pine/__snapshots__/generator.test.ts.snap`

- [ ] **Step 5: Commit**

```bash
git add client/src/pine/ client/src/__tests__/pine/
git commit -m "feat: pine script generator + snapshot test"
```

---

## Task 10: useCoinbaseData Hook

**Files:**
- Create: `client/src/hooks/useCoinbaseData.ts`

The hook makes two requests:
1. **Intraday candles** — last 300 candles at selected granularity (for chart display + session indicators)
2. **Daily candles** — last 60 daily candles (for previous period indicators)

- [ ] **Step 1: Write client/src/hooks/useCoinbaseData.ts**

```typescript
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
      const intradayDays = Math.ceil((300 * granularity) / 86_400);
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useCoinbaseData.ts
git commit -m "feat: useCoinbaseData hook with polling"
```

---

## Task 11: Chart Component

**Files:**
- Create: `client/src/components/Chart.tsx`

The Chart component creates a Lightweight Charts instance, sets candlestick data, and adds a price line for each `PriceLevel`.

- [ ] **Step 1: Write client/src/components/Chart.tsx**

```typescript
import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type CandlestickData,
} from 'lightweight-charts';
import type { Candle, PriceLevel } from '@shared/types/index.js';

type ChartProps = {
  candles: Candle[];
  levels: PriceLevel[];
};

export const Chart = ({ candles, levels }: ChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceLineRefs = useRef<IPriceLine[]>([]);

  // Initialize chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: '#e6edf3',
      },
      grid: {
        vertLines: { color: '#1c2128' },
        horzLines: { color: '#1c2128' },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#3fb950',
      downColor: '#f85149',
      borderUpColor: '#3fb950',
      borderDownColor: '#f85149',
      wickUpColor: '#3fb950',
      wickDownColor: '#f85149',
    });

    (chart as any).__candleSeries = candleSeries;
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update candle data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;

    const series = (chart as any).__candleSeries;
    const data: CandlestickData[] = candles.map(c => ({
      time: c.time as CandlestickData['time'],
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    series.setData(data);
    chart.timeScale().fitContent();
  }, [candles]);

  // Update price lines
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const series = (chart as any).__candleSeries;

    // Remove existing price lines
    for (const line of priceLineRefs.current) {
      series.removePriceLine(line);
    }
    priceLineRefs.current = [];

    // Add new price lines
    for (const level of levels) {
      const line = series.createPriceLine({
        price: level.value,
        color: level.color,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: level.label,
      });
      priceLineRefs.current.push(line);
    }
  }, [levels]);

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, minHeight: 0 }}
    />
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/Chart.tsx
git commit -m "feat: lightweight charts component with price lines"
```

---

## Task 12: Sessions Panel Component

**Files:**
- Create: `client/src/components/SessionsPanel.tsx`

The Sessions panel is a popover that shows each session's UTC definition and its current Chicago equivalent.

- [ ] **Step 1: Write client/src/components/SessionsPanel.tsx**

```typescript
import type { SessionConfig } from '@shared/types/index.js';
import { toChicago } from '../indicators/utils.js';

type SessionsPanelProps = {
  config: SessionConfig;
  onClose: () => void;
};

type SessionRow = {
  label: string;
  utcLabel: string;
  utcTimestamp: number;
};

const buildRows = (config: SessionConfig): SessionRow[] => {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return [
    {
      label: 'Asia Open',
      utcLabel: `${String(config.asiaOpenUtcHour).padStart(2, '0')}:00 UTC`,
      utcTimestamp: (todayUTC + config.asiaOpenUtcHour * 3_600_000) / 1000,
    },
    {
      label: 'Asia Close',
      utcLabel: `${String(config.asiaCloseUtcHour).padStart(2, '0')}:00 UTC`,
      utcTimestamp: (todayUTC + config.asiaCloseUtcHour * 3_600_000) / 1000,
    },
    {
      label: 'London Open',
      utcLabel: `${String(config.londonOpenUtcHour).padStart(2, '0')}:00 UTC`,
      utcTimestamp: (todayUTC + config.londonOpenUtcHour * 3_600_000) / 1000,
    },
    {
      label: 'London Close',
      utcLabel: `${String(config.londonCloseUtcHour).padStart(2, '0')}:00 UTC`,
      utcTimestamp: (todayUTC + config.londonCloseUtcHour * 3_600_000) / 1000,
    },
    {
      label: 'Daily Open',
      utcLabel: '00:00 UTC',
      utcTimestamp: todayUTC / 1000,
    },
  ];
};

export const SessionsPanel = ({ config, onClose }: SessionsPanelProps) => {
  const rows = buildRows(config);

  return (
    <div style={{
      position: 'absolute', top: 48, right: 12, zIndex: 10,
      background: '#161b22', border: '1px solid #30363d',
      borderRadius: 8, padding: '1rem', minWidth: 320,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 600 }}>Session Reference (CT)</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#e6edf3', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: '#8b949e', textAlign: 'left' }}>
            <th style={{ paddingBottom: '0.5rem' }}>Session</th>
            <th style={{ paddingBottom: '0.5rem' }}>UTC</th>
            <th style={{ paddingBottom: '0.5rem' }}>Chicago (CT)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label} style={{ borderTop: '1px solid #21262d' }}>
              <td style={{ padding: '0.4rem 0', color: '#e6edf3' }}>{row.label}</td>
              <td style={{ padding: '0.4rem 0', color: '#8b949e' }}>{row.utcLabel}</td>
              <td style={{ padding: '0.4rem 0', color: '#58a6ff' }}>{toChicago(row.utcTimestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/SessionsPanel.tsx
git commit -m "feat: sessions panel with UTC → Chicago reference"
```

---

## Task 13: PineExport + Header + App Assembly

**Files:**
- Create: `client/src/components/PineExport.tsx`
- Create: `client/src/components/Header.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Write client/src/components/PineExport.tsx**

```typescript
import { useState } from 'react';

type PineExportProps = {
  script: string;
};

export const PineExport = ({ script }: PineExportProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      borderTop: '1px solid #30363d',
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      background: '#0d1117',
    }}>
      <pre style={{
        flex: 1, overflow: 'auto', fontSize: 11,
        color: '#8b949e', margin: 0, maxHeight: 80,
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {script}
      </pre>
      <button
        onClick={handleCopy}
        style={{
          background: copied ? '#3fb950' : '#238636',
          border: 'none', borderRadius: 6,
          color: '#fff', cursor: 'pointer',
          padding: '0.4rem 0.8rem', fontSize: 13,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        {copied ? 'Copied!' : 'Copy Pine Script'}
      </button>
    </div>
  );
};
```

- [ ] **Step 2: Write client/src/components/Header.tsx**

```typescript
import type { SessionConfig } from '@shared/types/index.js';
import { SYMBOLS, GRANULARITIES } from '../config.js';

type Status = 'idle' | 'loading' | 'live' | 'stale' | 'error';

const STATUS_COLOR: Record<Status, string> = {
  idle: '#8b949e',
  loading: '#d29922',
  live: '#3fb950',
  stale: '#d29922',
  error: '#f85149',
};

type HeaderProps = {
  symbol: string;
  granularity: number;
  status: Status;
  config: SessionConfig;
  onSymbolChange: (s: string) => void;
  onGranularityChange: (g: number) => void;
  onSessionsClick: () => void;
};

const selectStyle: React.CSSProperties = {
  background: '#161b22', color: '#e6edf3',
  border: '1px solid #30363d', borderRadius: 6,
  padding: '0.3rem 0.6rem', fontSize: 13, cursor: 'pointer',
};

export const Header = ({
  symbol, granularity, status,
  onSymbolChange, onGranularityChange, onSessionsClick,
}: HeaderProps) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.5rem 1rem', borderBottom: '1px solid #30363d',
    background: '#0d1117',
  }}>
    <select style={selectStyle} value={symbol} onChange={e => onSymbolChange(e.target.value)}>
      {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>

    <select style={selectStyle} value={granularity} onChange={e => onGranularityChange(Number(e.target.value))}>
      {GRANULARITIES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
    </select>

    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: STATUS_COLOR[status], display: 'inline-block',
      }} />
      <button
        onClick={onSessionsClick}
        style={{ ...selectStyle, background: 'transparent' }}
      >
        Sessions ℹ
      </button>
    </div>
  </div>
);
```

- [ ] **Step 3: Write the complete client/src/App.tsx**

```typescript
import { useState } from 'react';
import type { SessionConfig } from '@shared/types/index.js';
import { DEFAULT_SESSION_CONFIG } from './config.js';
import { useCoinbaseData } from './hooks/useCoinbaseData.js';
import { useIndicators } from './hooks/useIndicators.js';
import { generatePineScript } from './pine/generator.js';
import { Chart } from './components/Chart.js';
import { Header } from './components/Header.js';
import { SessionsPanel } from './components/SessionsPanel.js';
import { PineExport } from './components/PineExport.js';

export const App = () => {
  const [symbol, setSymbol] = useState('BTC-USD');
  const [granularity, setGranularity] = useState(3600);
  const [showSessions, setShowSessions] = useState(false);
  const [config] = useState<SessionConfig>(DEFAULT_SESSION_CONFIG);

  const { intradayCandles, dailyCandles, status } = useCoinbaseData(symbol, granularity);
  const levels = useIndicators(dailyCandles, intradayCandles, config);
  const pineScript = generatePineScript(config);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      <Header
        symbol={symbol}
        granularity={granularity}
        status={status}
        config={config}
        onSymbolChange={setSymbol}
        onGranularityChange={setGranularity}
        onSessionsClick={() => setShowSessions(s => !s)}
      />

      {showSessions && (
        <SessionsPanel config={config} onClose={() => setShowSessions(false)} />
      )}

      <Chart candles={intradayCandles} levels={levels} />

      <PineExport script={pineScript} />
    </div>
  );
};
```

- [ ] **Step 4: Run all tests one final time**

Run: `npm test`

Expected: PASS — all client and server tests pass.

- [ ] **Step 5: Start both dev servers and verify in browser**

Run: `npm run dev`

Expected:
- Server starts on `http://localhost:3001`
- Client starts on `http://localhost:5173`

Open `http://localhost:5173` in browser. Verify:
1. Candlestick chart loads with BTC-USD data
2. Horizontal price lines appear for available indicators
3. Symbol and timeframe selectors work
4. Status dot turns green when data loads
5. Sessions ℹ button opens the reference panel with CT times
6. Pine Script panel at bottom shows generated script; Copy button works
7. Open TradingView → Pine Editor → paste script → Add to chart → key levels appear

- [ ] **Step 6: Commit**

```bash
git add client/src/
git commit -m "feat: complete UI — chart, header, sessions panel, pine export"
```

---

## Self-Review

**Spec coverage:**
- Previous Day/Week/Month H/L — Tasks 6 ✓
- Monday High — Task 7 ✓
- Daily/Asia/London Open, Asia/London H/L — Task 7 ✓
- Lightweight Charts preview — Task 11 ✓
- Pine Script generation + copy — Tasks 9, 13 ✓
- UTC-defined sessions, Chicago display — Tasks 5, 12 ✓
- Sessions reference panel — Task 12 ✓
- Status indicator (live/stale/error) — Task 13 ✓
- Coinbase REST proxy — Task 3 ✓
- Monorepo with npm workspaces — Task 1 ✓
- Arrow functions throughout — all tasks ✓

**Placeholder scan:** None found.

**Type consistency check:**
- `SessionConfig` used in Tasks 1, 5, 6, 7, 8, 9, 12, 13 — same shape throughout
- `PriceLevel` with fields `id, label, value, utcTime, displayTime, color` — consistent across all indicator files and consumer components
- `computeAllLevels(dailyCandles, intradayCandles, config)` defined in Task 8, called with same signature in Task 13
- `useCoinbaseData` returns `{ intradayCandles, dailyCandles, status }` — matches destructuring in App.tsx
- `generatePineScript(config: SessionConfig)` — consistent between Task 9 and Task 13
