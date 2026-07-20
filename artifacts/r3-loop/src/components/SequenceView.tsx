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

// Exact label column width — step-number header AND button rows both use this
// as their paddingLeft / div width so columns are pixel-perfectly aligned.
const LABEL_W = 64;

export function SequenceView({ bpm = 120 }: SequenceViewProps) {
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepCount, setStepCount]     = useState(16);
  const [pattern, setPattern]         = useState<boolean[][]>(() => makeDefaultPattern(16));
  const [clipboard, setClipboard]     = useState<boolean[][] | null>(null);
  const [activePattern, setActivePattern] = useState('A');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleCopy  = () => setClipboard(pattern.map(r => [...r]));
  const handlePaste = () => { if (clipboard) setPattern(clipboard.map(r => [...r])); };
  const handleClear = () => setPattern(prev => prev.map(r => r.map(() => false)));

  // ── Beat-separator builder ───────────────────────────────────────────────
  // Returns an interleaved array of step cells + 6px spacer divs at every
  // 4-step boundary. Used identically for BOTH the step-number header row
  // and every instrument button row → zero column drift, pixel-perfect alignment.
  const withBeatSeps = (renderCell: (col: number) => React.ReactNode): React.ReactNode[] => {
    const els: React.ReactNode[] = [];
    for (let col = 0; col < stepCount; col++) {
      els.push(renderCell(col));
      if ((col + 1) % 4 === 0 && col < stepCount - 1) {
        els.push(
          <div
            key={`bs-${col}`}
            style={{ width: 6, flexShrink: 0, background: 'transparent' }}
          />
        );
      }
    }
    return els;
  };

  const currentBeat = Math.floor(currentStep / 4);

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none" style={{ background: '#0a0a0a' }}>

      {/* ── Panel header ─────────────────────────────────────────────────── */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="panel-header-title">SEQUENCE</span>

          {/* Play / Stop */}
          <button
            onClick={() => setIsPlaying(p => !p)}
            style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
              padding: '2px 10px', borderRadius: 2, cursor: 'pointer',
              background: isPlaying ? '#B7FF00' : 'rgba(183,255,0,0.06)',
              color:      isPlaying ? '#000'    : '#666',
              border: `1px solid ${isPlaying ? '#B7FF00' : '#2a2a2a'}`,
              boxShadow: isPlaying
                ? '0 0 10px rgba(183,255,0,0.5), inset 0 1px 0 rgba(255,255,255,0.45)'
                : 'inset 0 1px 0 rgba(255,255,255,0.04)',
              letterSpacing: '0.06em',
              transition: 'all 0.12s',
            }}
          >{isPlaying ? '■ STOP' : '▶ PLAY'}</button>

          {/* Step-count selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 7,
              color: '#333', letterSpacing: '0.12em', marginRight: 3,
            }}>STEPS</span>
            {[16, 32].map(n => (
              <button key={n} onClick={() => changeStepCount(n)} style={{
                fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
                padding: '1px 7px', borderRadius: 2, cursor: 'pointer',
                background: stepCount === n ? 'rgba(183,255,0,0.1)' : 'transparent',
                color:      stepCount === n ? '#B7FF00' : '#333',
                border: `1px solid ${stepCount === n ? 'rgba(183,255,0,0.4)' : '#222'}`,
                transition: 'all 0.1s',
              }}>{n}</button>
            ))}
          </div>

          {/* Live playhead indicator */}
          {isPlaying && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#B7FF00', flexShrink: 0,
                animation: 'pulse 0.5s ease-in-out infinite alternate',
              }} />
              <span style={{
                fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
                color: '#B7FF00', letterSpacing: '0.05em',
              }}>STEP {currentStep + 1}/{stepCount}</span>
            </div>
          )}
        </div>
        <span className="panel-header-meta">1/16 · {bpm} BPM</span>
      </div>

      {/* ── Step grid ────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', padding: '10px 12px 8px 12px', gap: 2,
      }}>

        {/* Beat numbers row — shows "1  2  3  4 …" above each group of 4 */}
        <div style={{ display: 'flex', paddingLeft: LABEL_W, flexShrink: 0, height: 13 }}>
          {withBeatSeps(col => (
            <div key={col} style={{
              flex: 1, textAlign: 'center',
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: col % 4 === 0 ? 8 : 5,
              fontWeight: col % 4 === 0 ? 700 : 400,
              color: col % 4 === 0
                ? (isPlaying && currentBeat === col / 4 ? '#B7FF00' : '#3a3a3a')
                : 'transparent',
              textShadow: (isPlaying && currentBeat === col / 4 && col % 4 === 0)
                ? '0 0 8px rgba(183,255,0,0.8)' : 'none',
              letterSpacing: '0.05em',
              transition: 'color 0.07s, text-shadow 0.07s',
            }}>
              {col % 4 === 0 ? String(col / 4 + 1) : ''}
            </div>
          ))}
        </div>

        {/* Step-number row — 1-16 or 1-32 */}
        {/* paddingLeft: LABEL_W matches instrument label divs exactly → no drift */}
        <div style={{ display: 'flex', paddingLeft: LABEL_W, flexShrink: 0, height: 10, gap: 1 }}>
          {withBeatSeps(col => (
            <div key={col} style={{
              flex: 1, textAlign: 'center',
              fontFamily: "'Share Tech Mono',monospace", fontSize: 6,
              color: isPlaying && currentStep === col
                ? '#B7FF00'
                : col % 4 === 0 ? '#2d2d2d' : '#1a1a1a',
              textShadow: isPlaying && currentStep === col
                ? '0 0 6px rgba(183,255,0,0.7)' : 'none',
              transition: 'color 0.04s',
            }}>{col + 1}</div>
          ))}
        </div>

        {/* Instrument rows */}
        {INSTRUMENTS.map((inst, row) => (
          <div
            key={row}
            style={{
              flex: 1, minHeight: 0, display: 'flex', alignItems: 'stretch',
              borderRadius: 2, overflow: 'hidden',
              // Alternating row backgrounds — aids row tracking
              background: row % 2 === 1 ? 'rgba(255,255,255,0.014)' : 'transparent',
            }}
          >
            {/* Instrument label — width exactly LABEL_W; buttons start at same x */}
            <div style={{
              width: LABEL_W, flexShrink: 0, display: 'flex', alignItems: 'center',
            }}>
              {/* Colored left-edge accent bar */}
              <div style={{
                width: 3, alignSelf: 'stretch', flexShrink: 0,
                background: `linear-gradient(180deg, ${inst.color}80 0%, ${inst.color}20 100%)`,
              }} />
              <span style={{
                flex: 1, textAlign: 'right', paddingRight: 8, paddingLeft: 5,
                fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
                color: inst.color, opacity: 0.85,
                textShadow: `0 0 5px ${inst.color}40`,
                letterSpacing: '0.05em',
              }}>{inst.name}</span>
            </div>

            {/* Step buttons — gap:1 + beat-group spacers; matches header exactly */}
            <div style={{ flex: 1, display: 'flex', gap: 1, alignItems: 'stretch', minWidth: 0 }}>
              {withBeatSeps(col => {
                const active    = pattern[row]?.[col] ?? false;
                const isCurrent = isPlaying && currentStep === col;
                const beatGroup = Math.floor(col / 4);
                const isBeatStart = col % 4 === 0;

                return (
                  <button
                    key={col}
                    onClick={() => toggleStep(row, col)}
                    style={{
                      flex: 1, minHeight: 0, minWidth: 0,
                      borderRadius: 2, cursor: 'pointer', border: 'none',
                      // Background priority: active > current > beat-start > group-alt > base
                      background: active
                        ? isCurrent
                          ? inst.color
                          : `${inst.color}CC`
                        : isCurrent
                          ? 'rgba(255,255,255,0.11)'
                          : isBeatStart
                            ? 'rgba(255,255,255,0.058)'
                            : beatGroup % 2 === 0
                              ? 'rgba(255,255,255,0.03)'
                              : 'rgba(255,255,255,0.018)',
                      boxShadow: active
                        ? `0 0 7px ${inst.color}55,
                           inset 0  1px 0 rgba(255,255,255,0.28),
                           inset 0 -1px 0 rgba(0,0,0,0.3)`
                        : isCurrent
                          ? 'inset 0 0 0 1px rgba(183,255,0,0.55)'
                          : isBeatStart
                            ? 'inset 0 0 0 1px rgba(255,255,255,0.07)'
                            : 'none',
                      transition: 'background 0.04s, box-shadow 0.04s',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Pattern bank / toolbar ────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
        height: 34, padding: '0 12px',
        background: '#0d0d0d', borderTop: '1px solid #1c1c1c',
      }}>
        <span style={{
          fontFamily: "'Share Tech Mono',monospace", fontSize: 7,
          color: '#2e2e2e', letterSpacing: '0.14em', marginRight: 3, flexShrink: 0,
        }}>PATTERN</span>

        {['A','B','C','D','E','F','G','H'].map(p => {
          const active = activePattern === p;
          return (
            <button
              key={p}
              onClick={() => setActivePattern(p)}
              style={{
                width: 24, height: 20, borderRadius: 2, cursor: 'pointer',
                fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
                background: active ? 'rgba(183,255,0,0.1)' : 'rgba(255,255,255,0.025)',
                color:      active ? '#B7FF00' : '#3e3e3e',
                border: `1px solid ${active ? 'rgba(183,255,0,0.45)' : '#252525'}`,
                boxShadow: active
                  ? '0 0 8px rgba(183,255,0,0.25), inset 0 1px 0 rgba(183,255,0,0.15)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                textShadow: active ? '0 0 8px rgba(183,255,0,0.7)' : 'none',
                transition: 'all 0.1s', flexShrink: 0,
              }}
            >{p}</button>
          );
        })}

        {/* Action buttons — right-aligned */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {[
            { label: 'COPY',  fn: handleCopy,  c: '#3e3e3e' },
            { label: 'PASTE', fn: handlePaste, c: clipboard ? '#B7FF00' : '#3e3e3e' },
            { label: 'CLEAR', fn: handleClear, c: '#FF3B3B' },
          ].map(a => (
            <button key={a.label} onClick={a.fn} style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 7,
              padding: '3px 10px', letterSpacing: '0.09em',
              background: 'rgba(255,255,255,0.02)',
              color: a.c,
              border: `1px solid ${a.c === '#3e3e3e' ? '#252525' : a.c + '35'}`,
              boxShadow: a.c !== '#3e3e3e' ? `0 0 7px ${a.c}18, inset 0 1px 0 rgba(255,255,255,0.04)` : 'inset 0 1px 0 rgba(255,255,255,0.04)',
              cursor: 'pointer', borderRadius: 2,
              transition: 'all 0.1s',
            }}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
