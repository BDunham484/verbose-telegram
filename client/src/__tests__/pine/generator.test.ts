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
