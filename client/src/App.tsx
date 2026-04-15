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
