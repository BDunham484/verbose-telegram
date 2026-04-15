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
