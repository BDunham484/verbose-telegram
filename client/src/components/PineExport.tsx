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
