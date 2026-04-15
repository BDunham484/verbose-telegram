# TradingView Key Levels Indicator Tool — Design Spec

**Date:** 2026-04-14
**Status:** Approved

---

## Overview

A personal web application for authoring and previewing session-based key level indicators, with automatic Pine Script generation for deployment into TradingView. Built as a foundation for eventual Coinbase-powered trade execution.

---

## Goals

- Display session-based price levels (previous period highs/lows, session opens) on a live chart
- Preview indicators locally before deploying to TradingView
- Generate valid Pine Script from computed levels — copy and paste into TradingView's Pine Editor
- Lay groundwork for Coinbase trade execution integration

## Non-Goals (v1)

- No TradingView account integration or automated Pine Script publishing
- No trade execution (future milestone)
- No multi-user support
- No indicator types beyond session-based key levels

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript (via `tsx`) |
| Charting | TradingView Lightweight Charts |
| Data source | Coinbase REST API (historical) + WebSocket (real-time) |
| Testing | Vitest |
| Package management | npm workspaces (monorepo) |

---

## Project Structure

```
verbose-telegram/
├── client/                  # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/      # Chart, IndicatorPanel, SessionKey, PineExport
│   │   ├── indicators/      # One file per indicator (pure TS arrow functions)
│   │   ├── pine/            # Pine Script generator
│   │   └── hooks/           # useCoinbaseData, useIndicators
│   └── vite.config.ts       # Dev proxy: /api/* → Express
├── server/                  # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/          # /api/candles (future: /api/ws, /api/trade)
│   │   └── coinbase/        # Coinbase REST client + WebSocket client
├── shared/
│   └── types/               # Shared TS types: Candle, PriceLevel, Session, SessionConfig
└── package.json             # Root npm workspace + dev/build scripts
```

---

## Indicators (v1)

All session times are defined in UTC and displayed in `America/Chicago` timezone.

| Indicator | ID | Session Boundary |
|---|---|---|
| Previous Day High | `PDH` | 00:00 UTC previous day |
| Previous Day Low | `PDL` | 00:00 UTC previous day |
| Previous Week High | `PWH` | Monday 00:00 UTC previous week |
| Previous Week Low | `PWL` | Monday 00:00 UTC previous week |
| Previous Month High | `PMH` | 1st of previous month 00:00 UTC |
| Previous Month Low | `PML` | 1st of previous month 00:00 UTC |
| Monday High | `MON_H` | Monday 00:00 UTC current week |
| Daily Open | `DO` | 00:00 UTC current day |
| Asia Open | `ASIA_O` | 00:00 UTC (configurable) |
| Asia High | `ASIA_H` | Asia session range |
| Asia Low | `ASIA_L` | Asia session range |
| London Open | `LON_O` | 08:00 UTC (configurable) |
| London High | `LON_H` | London session range |
| London Low | `LON_L` | London session range |

---

## Shared Types

```typescript
// shared/types/index.ts

export type Candle = {
  time: number;      // Unix timestamp UTC
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
  displayTime: string;   // Pre-formatted America/Chicago string
  color: string;
};

export type SessionConfig = {
  displayTimezone: "America/Chicago";
  asiaOpenUtcHour: number;    // default: 0
  londonOpenUtcHour: number;  // default: 8
};
```

---

## Data Flow

```
Coinbase REST API
      │
      ▼
Express /api/candles
  (proxies + caches OHLCV data)
      │
      ▼
React useCoinbaseData hook
  (fetches on symbol/timeframe change)
      │
      ▼
indicators/ (pure TS arrow functions)
  (candles + SessionConfig → PriceLevel[])
      │
      ├──▶ Lightweight Charts
      │      (renders PriceLevel[] as horizontal lines)
      │
      └──▶ pine/ generator
             (PriceLevel[] → Pine Script string)
                  │
                  ▼
            Copy to Clipboard → Paste into TradingView Pine Editor
```

**Real-time updates:**
- Coinbase WebSocket → Express WebSocket proxy → client
- Keeps the latest candle live without re-fetching full history

**Rule:** No indicator logic lives on the server. Express is a data proxy only.

---

## Indicator Implementation Pattern

Each indicator is a pure arrow function in its own file:

```typescript
// client/src/indicators/previousDayHigh.ts
export const previousDayHigh = (candles: Candle[], config: SessionConfig): PriceLevel => {
  const prevDay = getPreviousDayCandles(candles, config.displayTimezone);
  return {
    id: "PDH",
    label: "PDH",
    value: Math.max(...prevDay.map(c => c.high)),
    utcTime: prevDay[0].time,
    displayTime: toChicago(prevDay[0].time),
    color: "#F59E0B",
  };
};
```

All indicators follow this same shape — different session boundary logic, same `PriceLevel` output.

---

## Pine Script Generation

The generator maps each `PriceLevel` to a Pine Script v5 template:

```typescript
// client/src/pine/generator.ts
export const generatePineScript = (levels: PriceLevel[]): string => { ... };
```

Output is a complete, valid Pine Script v5 indicator that plots all levels as horizontal lines with labels. User copies via a button in the Export Panel and pastes into TradingView's Pine Editor.

---

## Timezone Handling

- All session boundaries defined as fixed UTC hours
- Display timezone is hardcoded to `America/Chicago`
- UTC → Chicago conversion uses the browser's native `Intl.DateTimeFormat` — no library needed
- DST in other regions is handled automatically: the Chicago display time adjusts correctly when e.g. London's UTC offset changes
- The Sessions reference panel shows each level's UTC definition alongside its current Chicago equivalent

---

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  [Symbol: BTC-USD ▼]  [Timeframe: 1H ▼]  [Sessions ℹ]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│   PDH  ────────────────────────────────────────     │
│   PWH  ────────────────────────────────────────     │
│   Asia Hi ─────────────────────────────────────     │
│   London Open ─────────────────────────────────     │
│                                                     │
│            [Lightweight Chart — candlesticks]       │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Generated Pine Script          [Copy to Clipboard] │
└─────────────────────────────────────────────────────┘
```

**Color coding by group:**
- Previous period levels (PDH, PDL, PWH, PWL, PMH, PML): amber
- Asia session levels: blue
- London session levels: purple
- Daily/Monday opens: white/gray

**Sessions ℹ panel (drawer/popover):**

```
Session Reference — all times displayed in CT
─────────────────────────────────────────────
Asia Open       00:00 UTC  →  06:00 PM CT (prev day)
London Open     08:00 UTC  →  02:00 AM CT
Daily Open      00:00 UTC  →  06:00 PM CT (prev day)
```

---

## Error Handling

- Coinbase API failure → chart shows last known data, stale badge in header
- WebSocket disconnect → auto-reconnect with exponential backoff, status dot (green/yellow/red) in header
- Missing/null candle data → indicator returns `null`, level line not drawn — no crash
- No toast libraries or error boundaries needed for v1

---

## Testing

- **Indicator functions:** Unit tests in Vitest — pure functions with deterministic inputs/outputs
- **Pine Script generator:** Snapshot tests — ensures generated output stays valid as indicators are added
- **UI:** Visual verification against the live chart — no automated UI tests in v1
- Tooling: Vitest for both `client/` and `server/`

---

## Future Milestones

1. **Coinbase WebSocket real-time data** — live price updates without re-fetching history
2. **Additional indicators** — user-defined session times, more moving average types
3. **Coinbase trading integration** — authenticated Express routes, API key storage, order execution
4. **Configurable session times** — UI for adjusting Asia/London open hours
