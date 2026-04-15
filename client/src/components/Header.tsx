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
