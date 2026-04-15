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
