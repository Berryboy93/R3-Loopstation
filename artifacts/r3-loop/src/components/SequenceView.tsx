import { useState, useEffect, useRef } from 'react';

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

const STEPS = 16;

export function SequenceView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [pattern, setPattern] = useState<boolean[][]>(() =>
    INSTRUMENTS.map((_, row) =>
      Array.from({ length: STEPS }, (_, col) => {
        if (row === 0) return [0,4,8,12].includes(col);
        if (row === 1) return [4,12].includes(col);
        if (row === 2) return [2,6,10,14].includes(col);
        return Math.random() > 0.75;
      })
    )
  );
  const [activePattern, setActivePattern] = useState('A');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(s => (s + 1) % STEPS);
      }, 125);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentStep(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const toggleStep = (row: number, col: number) => {
    setPattern(prev => prev.map((r, ri) =>
      ri === row ? r.map((v, ci) => ci === col ? !v : v) : r
    ));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="h-8 flex items-center gap-4 px-4 shrink-0" style={{ background: '#111', borderBottom: '1px solid #222' }}>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.12em' }}>SEQUENCE</span>
        <button
          onClick={() => setIsPlaying(p => !p)}
          style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
            padding: '2px 10px', background: isPlaying ? '#B7FF00' : 'transparent',
            color: isPlaying ? '#000' : '#888',
            border: `1px solid ${isPlaying ? '#B7FF00' : '#333'}`,
            boxShadow: isPlaying ? '0 0 8px rgba(183,255,0,0.5)' : 'none',
            cursor: 'pointer', borderRadius: 2,
          }}
        >{isPlaying ? '■ STOP' : '▶ PLAY'}</button>
        <div className="flex items-center gap-2 ml-2">
          {['16','32','64'].map(n => (
            <button key={n} style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
              padding: '2px 6px', background: n === '16' ? 'rgba(183,255,0,0.1)' : 'transparent',
              color: n === '16' ? '#B7FF00' : '#555',
              border: `1px solid ${n === '16' ? 'rgba(183,255,0,0.4)' : '#222'}`,
              cursor: 'pointer', borderRadius: 2,
            }}>{n}</button>
          ))}
        </div>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#555', marginLeft: 'auto' }}>1/16 GRID</span>
      </div>

      {/* Step grid */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 gap-1">
        {/* Step numbers */}
        <div className="flex" style={{ paddingLeft: 68 }}>
          {Array.from({ length: STEPS }).map((_, col) => (
            <div key={col} style={{
              flex: 1, textAlign: 'center',
              fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
              color: currentStep === col && isPlaying ? '#B7FF00' : '#333',
              marginRight: (col + 1) % 4 === 0 && col < STEPS - 1 ? 6 : 1,
              textShadow: currentStep === col && isPlaying ? '0 0 6px #B7FF00' : 'none',
            }}>{col + 1}</div>
          ))}
        </div>

        {INSTRUMENTS.map((inst, row) => (
          <div key={row} className="flex items-center gap-1" style={{ flex: 1, minHeight: 0 }}>
            {/* Instrument label */}
            <div style={{
              width: 60, flexShrink: 0, fontFamily: "'Share Tech Mono',monospace",
              fontSize: 9, color: inst.color, textAlign: 'right', paddingRight: 8,
              textShadow: `0 0 6px ${inst.color}60`,
            }}>{inst.name}</div>

            {/* Steps */}
            {Array.from({ length: STEPS }).map((_, col) => {
              const active = pattern[row][col];
              const isCurrent = currentStep === col && isPlaying;
              return (
                <button
                  key={col}
                  onClick={() => toggleStep(row, col)}
                  style={{
                    flex: 1, minHeight: 28, borderRadius: 2, cursor: 'pointer',
                    marginRight: (col + 1) % 4 === 0 && col < STEPS - 1 ? 5 : 0,
                    background: active
                      ? isCurrent ? inst.color : `${inst.color}CC`
                      : isCurrent ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    border: active
                      ? `1px solid ${inst.color}`
                      : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: active ? `0 0 6px ${inst.color}60` : isCurrent ? '0 0 4px rgba(183,255,0,0.2)' : 'none',
                    transition: 'all 0.05s',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Pattern row */}
      <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ background: '#111', borderTop: '1px solid #222' }}>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#555', marginRight: 4 }}>PATTERN</span>
        {['A','B','C','D','E','F','G','H'].map(p => (
          <button
            key={p}
            onClick={() => setActivePattern(p)}
            style={{
              width: 28, height: 22, borderRadius: 2, cursor: 'pointer',
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
              background: activePattern === p ? '#B7FF00' : 'rgba(255,255,255,0.04)',
              color: activePattern === p ? '#000' : '#666',
              border: `1px solid ${activePattern === p ? '#B7FF00' : '#333'}`,
              boxShadow: activePattern === p ? '0 0 6px rgba(183,255,0,0.5)' : 'none',
            }}
          >{p}</button>
        ))}
        <div className="flex gap-1 ml-auto">
          {['COPY','PASTE','CLEAR'].map(a => (
            <button key={a} style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
              padding: '2px 8px', background: 'transparent',
              color: '#555', border: '1px solid #333', cursor: 'pointer', borderRadius: 2,
            }}>{a}</button>
          ))}
        </div>
      </div>
    </div>
  );
}