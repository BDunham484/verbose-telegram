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
