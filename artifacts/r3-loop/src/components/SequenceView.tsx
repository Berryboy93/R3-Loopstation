import { useState, useEffect, useRef, useCallback } from 'react';

const INSTRUMENTS = [
  { name: 'KICK',  color: '#39FF14' },
  { name: 'SNARE', color: '#00BFFF' },
  { name: 'HIHAT', color: '#FF8C00' },
  { name: 'CLAP',  color: '#BF5FFF' },
  { name: 'BASS',  color: '#FF3B3B' },
  { name: 'LEAD',  color: '#FFD700' },
  { name: 'PAD',   color: '#B7FF00' },
  { name: 'FX',    color: '#FF69B4' },
];

function makeDefaultPattern(steps: number): boolean[][] {
  return INSTRUMENTS.map((_, row) =>
    Array.from({ length: steps }, (_, col) => {
      if (row === 0) return [0,4,8,12].includes(col);
      if (row === 1) return [4,12].includes(col);
      if (row === 2) return [2,6,10,14].includes(col);
      return Math.random() > 0.8;
    })
  );
}

interface SequenceViewProps {
  bpm?: number;
}

export function SequenceView({ bpm = 120 }: SequenceViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepCount, setStepCount] = useState(16);
  const [pattern, setPattern] = useState<boolean[][]>(() => makeDefaultPattern(16));
  const [clipboard, setClipboard] = useState<boolean[][] | null>(null);
  const [activePattern, setActivePattern] = useState('A');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When step count changes, extend or trim pattern
  const changeStepCount = useCallback((n: number) => {
    setStepCount(n);
    setCurrentStep(0);
    setIsPlaying(false);
    setPattern(prev => prev.map(row =>
      n > row.length
        ? [...row, ...Array(n - row.length).fill(false)]
        : row.slice(0, n)
    ));
  }, []);

  useEffect(() => {
    if (isPlaying) {
      // 16th-note interval derived from global BPM: 60000ms / bpm / 4 subdivisions
      const interval16th = Math.round(60000 / bpm / 4);
      intervalRef.current = setInterval(() => {
        setCurrentStep(s => (s + 1) % stepCount);
      }, interval16th);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentStep(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, stepCount, bpm]);

  const toggleStep = (row: number, col: number) => {
    setPattern(prev => prev.map((r, ri) =>
      ri === row ? r.map((v, ci) => ci === col ? !v : v) : r
    ));
  };

  const handleCopy = () => setClipboard(pattern.map(r => [...r]));
  const handlePaste = () => { if (clipboard) setPattern(clipboard.map(r => [...r])); };
  const handleClear = () => setPattern(prev => prev.map(r => r.map(() => false)));

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="panel-header-title">SEQUENCE</span>

          <button
            onClick={() => setIsPlaying(p => !p)}
            style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
              padding: '2px 10px',
              background: isPlaying ? '#B7FF00' : 'rgba(183,255,0,0.08)',
              color: isPlaying ? '#000' : '#888',
              border: `1px solid ${isPlaying ? '#B7FF00' : '#333'}`,
              boxShadow: isPlaying ? '0 0 8px rgba(183,255,0,0.5)' : 'none',
              cursor: 'pointer', borderRadius: 2,
              transition: 'all 0.15s',
            }}
          >{isPlaying ? '■ STOP' : '▶ PLAY'}</button>

          {/* Step count selector */}
          <div className="flex items-center gap-1">
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#444', marginRight: 2 }}>STEPS</span>
            {[16, 32].map(n => (
              <button key={n} onClick={() => changeStepCount(n)} style={{
                fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
                padding: '2px 6px',
                background: stepCount === n ? 'rgba(183,255,0,0.12)' : 'transparent',
                color: stepCount === n ? '#B7FF00' : '#444',
                border: `1px solid ${stepCount === n ? 'rgba(183,255,0,0.4)' : '#222'}`,
                cursor: 'pointer', borderRadius: 2, transition: 'all 0.1s',
              }}>{n}</button>
            ))}
          </div>

          {/* Playhead indicator */}
          {isPlaying && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#B7FF00', boxShadow: '0 0 6px rgba(183,255,0,0.8)', animation: 'pulse 0.5s ease-in-out infinite alternate' }} />
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#B7FF00' }}>STEP {currentStep + 1}/{stepCount}</span>
            </div>
          )}
        </div>

        <span className="panel-header-meta">1/16 · {bpm} BPM</span>
      </div>

      {/* Step grid */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 gap-[3px]">
        {/* Step numbers */}
        <div className="flex" style={{ paddingLeft: 66 }}>
          {Array.from({ length: stepCount }).map((_, col) => (
            <div key={col} style={{
              flex: 1, textAlign: 'center',
              fontFamily: "'Share Tech Mono',monospace", fontSize: 7,
              color: isPlaying && currentStep === col ? '#B7FF00' : col % 4 === 0 ? '#444' : '#252525',
              marginRight: (col + 1) % 4 === 0 && col < stepCount - 1 ? 4 : 0,
              textShadow: isPlaying && currentStep === col ? '0 0 6px #B7FF00' : 'none',
              transition: 'color 0.05s',
            }}>{col + 1}</div>
          ))}
        </div>

        {INSTRUMENTS.map((inst, row) => (
          <div key={row} className="flex items-center" style={{ flex: 1, minHeight: 0, gap: 0 }}>
            {/* Instrument label */}
            <div style={{
              width: 58, flexShrink: 0, fontFamily: "'Share Tech Mono',monospace",
              fontSize: 8, color: inst.color, textAlign: 'right', paddingRight: 8,
              textShadow: `0 0 5px ${inst.color}50`, letterSpacing: '0.05em',
            }}>{inst.name}</div>

            {/* Steps */}
            <div className="flex flex-1" style={{ gap: 0 }}>
              {Array.from({ length: stepCount }).map((_, col) => {
                const active = pattern[row]?.[col] ?? false;
                const isCurrent = isPlaying && currentStep === col;
                const isGroupEnd = (col + 1) % 4 === 0 && col < stepCount - 1;
                return (
                  <button
                    key={col}
                    onClick={() => toggleStep(row, col)}
                    style={{
                      flex: 1, minHeight: 0, height: '100%',
                      borderRadius: 2, cursor: 'pointer',
                      marginRight: isGroupEnd ? 4 : 1,
                      background: active
                        ? isCurrent ? inst.color : `${inst.color}BB`
                        : isCurrent ? 'rgba(255,255,255,0.1)' : col % 4 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                      border: active
                        ? `1px solid ${inst.color}`
                        : `1px solid ${isCurrent ? 'rgba(183,255,0,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      boxShadow: active ? `0 0 5px ${inst.color}50` : 'none',
                      transition: 'background 0.04s, box-shadow 0.04s',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pattern bank + actions */}
      <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ background: '#111', borderTop: '1px solid #222' }}>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#444', marginRight: 2 }}>PATTERN</span>
        {['A','B','C','D','E','F','G','H'].map(p => (
          <button
            key={p}
            onClick={() => setActivePattern(p)}
            style={{
              width: 26, height: 20, borderRadius: 2, cursor: 'pointer',
              fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
              background: activePattern === p ? '#B7FF00' : 'rgba(255,255,255,0.03)',
              color: activePattern === p ? '#000' : '#555',
              border: `1px solid ${activePattern === p ? '#B7FF00' : '#2a2a2a'}`,
              boxShadow: activePattern === p ? '0 0 6px rgba(183,255,0,0.45)' : 'none',
              transition: 'all 0.1s',
            }}
          >{p}</button>
        ))}
        <div className="flex gap-1 ml-auto">
          {[
            { label: 'COPY',  fn: handleCopy,  color: '#555' },
            { label: 'PASTE', fn: handlePaste, color: clipboard ? '#B7FF00' : '#555' },
            { label: 'CLEAR', fn: handleClear, color: '#FF3B3B' },
          ].map(a => (
            <button key={a.label} onClick={a.fn} style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
              padding: '2px 8px', background: 'transparent',
              color: a.color, border: `1px solid ${a.color === '#555' ? '#2a2a2a' : a.color + '50'}`,
              cursor: 'pointer', borderRadius: 2, transition: 'all 0.1s',
            }}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
