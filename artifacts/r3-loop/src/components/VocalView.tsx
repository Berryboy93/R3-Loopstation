import { useState, useRef, useEffect, useCallback } from 'react';
import { Knob } from './Knob';

const KEYS   = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const SCALES = ['CHROMATIC','MAJOR','MINOR','DORIAN','MIXOLYDIAN','CUSTOM'];
const PRESETS = [
  { name: 'NATURAL',  retune: 0.35, humanize: 0.6,  formant: 0.5,  mix: 0.85 },
  { name: 'ROBOT',    retune: 0.95, humanize: 0.05, formant: 0.3,  mix: 1.0  },
  { name: 'CHOIR',    retune: 0.6,  humanize: 0.7,  formant: 0.65, mix: 0.75 },
  { name: 'HARD',     retune: 0.9,  humanize: 0.1,  formant: 0.5,  mix: 0.95 },
  { name: 'FOLK',     retune: 0.25, humanize: 0.8,  formant: 0.55, mix: 0.6  },
  { name: 'POP',      retune: 0.55, humanize: 0.5,  formant: 0.5,  mix: 0.9  },
  { name: 'SUBTLE',   retune: 0.2,  humanize: 0.85, formant: 0.5,  mix: 0.45 },
  { name: 'CUSTOM',   retune: 0.5,  humanize: 0.5,  formant: 0.5,  mix: 0.7  },
];

function generatePitchPoints(width: number, height: number, t: number): string {
  const segments = 40;
  return Array.from({ length: segments + 1 }, (_, i) => {
    const x = (i / segments) * width;
    const phase = (i / segments) * Math.PI * 4 + t;
    const target = Math.round(Math.sin(phase * 0.4) * 4) * (height / 12);
    const drift  = Math.sin(phase * 3.2) * (height / 24) + Math.sin(phase * 7.1) * (height / 48);
    const y = Math.max(4, Math.min(height - 4, height / 2 + target + drift));
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

const TWO_PI_100 = Math.PI * 2 * 100;

// ── Compact chain-step badge ───────────────────────────────────────────────
function ChainStep({ num, label, color, active, onToggle }: {
  num: number; label: string; color: string; active?: boolean; onToggle?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{
        width: 16, height: 16, borderRadius: 3, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color }}>{num}</span>
      </div>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color, letterSpacing: '0.14em', fontWeight: 700 }}>{label}</span>
      {onToggle && (
        <button
          onClick={onToggle}
          style={{
            marginLeft: 'auto', fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
            padding: '2px 7px', borderRadius: 2, cursor: 'pointer',
            background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
            color: active ? color : '#444',
            border: `1px solid ${active ? color + '50' : '#222'}`,
            transition: 'all 0.12s',
          }}
        >{active ? 'ON' : 'OFF'}</button>
      )}
    </div>
  );
}

// ── Simulated GR bar ──────────────────────────────────────────────────────
function GRMeter({ value, color }: { value: number; color: string }) {
  const db = -(value * 12);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 28 }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: '#444' }}>GR</div>
      <div style={{ width: 6, height: 48, background: '#111', borderRadius: 2, border: '1px solid #1e1e1e', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse' }}>
        <div style={{ width: '100%', height: `${Math.min(100, value * 100)}%`, background: color, boxShadow: `0 0 4px ${color}`, transition: 'height 0.3s' }} />
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: value > 0.01 ? color : '#333' }}>
        {db.toFixed(1)}
      </div>
    </div>
  );
}

export function VocalView() {
  // ── Pitch correction ─────────────────────────────────────────────
  const [bypassed, setBypassed]       = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedKey, setKey]         = useState('C');
  const [selectedScale, setScale]     = useState('MAJOR');
  const [selectedPreset, setPreset]   = useState('NATURAL');
  const [retune, setRetune]           = useState(0.35);
  const [humanize, setHumanize]       = useState(0.6);
  const [formant, setFormant]         = useState(0.5);
  const [mix, setMix]                 = useState(0.85);
  const [showKeyMenu, setShowKeyMenu]     = useState(false);
  const [showScaleMenu, setShowScaleMenu] = useState(false);

  // ── De-esser (step 3 of vocal chain) ─────────────────────────────
  const [deEsserActive, setDeEsserActive] = useState(true);
  const [deEsserThresh, setDeEsserThresh] = useState(0.52);
  const [deEsserFreq,   setDeEsserFreq]   = useState(0.68);   // 0=4kHz … 1=16kHz
  const [deEsserBand,   setDeEsserBand]   = useState('8kHz');

  // ── Dynamics / Compressor (step 5 of vocal chain) ─────────────────
  const [compActive,  setCompActive]  = useState(true);
  const [compThresh,  setCompThresh]  = useState(0.42);  // ≈ -16 dB (vocal sweet spot)
  const [compRatio,   setCompRatio]   = useState(0.45);  // ≈ 3:1
  const [compAttack,  setCompAttack]  = useState(0.22);  // ≈ 5 ms
  const [compRelease, setCompRelease] = useState(0.55);  // ≈ 80 ms

  // ── Pitch graph ───────────────────────────────────────────────────
  const [pitchT, setPitchT] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (bypassed) { cancelAnimationFrame(rafRef.current); return; }
    const tick = () => { setPitchT(t => (t + 0.012) % TWO_PI_100); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [bypassed]);

  // ── Dropdown outside-click ────────────────────────────────────────
  const keyBtnRef   = useRef<HTMLButtonElement>(null);
  const scaleBtnRef = useRef<HTMLButtonElement>(null);
  const closeMenus = useCallback((e: MouseEvent) => {
    if (
      keyBtnRef.current   && !keyBtnRef.current.contains(e.target as Node) &&
      scaleBtnRef.current && !scaleBtnRef.current.contains(e.target as Node)
    ) { setShowKeyMenu(false); setShowScaleMenu(false); }
  }, []);
  useEffect(() => {
    document.addEventListener('mousedown', closeMenus);
    return () => document.removeEventListener('mousedown', closeMenus);
  }, [closeMenus]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setPreset(p.name);
    setRetune(p.retune); setHumanize(p.humanize); setFormant(p.formant); setMix(p.mix);
  };

  // ── Derived display values ────────────────────────────────────────
  const semitoneRows = Array.from({ length: 13 }, (_, i) => ({
    y: (i / 12) * 180, note: KEYS[i % 12], isRoot: KEYS[i % 12] === selectedKey,
  }));
  const correctionPct   = Math.round(retune * 100);
  const detectedOffset  = (Math.sin(pitchT * 3) * 4.2).toFixed(1);
  const inputDb         = (-14.2 + Math.sin(pitchT * 2.1) * 3.5).toFixed(1);
  const pitchPath       = generatePitchPoints(420, 180, pitchT);
  const correctedPath   = generatePitchPoints(420, 180, pitchT * (1 - retune * 0.7));

  // Simulated GR values (visual only)
  const esserGr  = deEsserActive ? (1 - deEsserThresh) * 0.25 : 0;
  const compGr   = compActive    ? (1 - compThresh) * compRatio * 0.7 : 0;

  const SECT: React.CSSProperties = {
    padding: '14px 16px',
    borderBottom: '1px solid #1a1a1a',
    flexShrink: 0,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none" style={{ background: '#090909', position: 'relative' }}>

      {/* ── Header ── */}
      <div className="panel-header" style={{ borderBottom: 'rgba(183,255,0,0.2) 1px solid' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="panel-header-title">VOCAL PRODUCTION</span>
          {!bypassed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B7FF00', boxShadow: 'var(--glow-green-2)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
              <span style={{ font: 'var(--type-status)', color: '#B7FF00' }}>LIVE</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setBypassed(b => !b)} style={{
            font: 'var(--type-label)', padding: '3px 10px', borderRadius: 2, cursor: 'pointer',
            background: bypassed ? 'rgba(255,59,59,0.15)' : 'transparent',
            color: bypassed ? '#FF3B3B' : '#555',
            border: `1px solid ${bypassed ? 'rgba(255,59,59,0.5)' : '#2a2a2a'}`,
            boxShadow: bypassed ? 'var(--glow-red-1)' : 'none', transition: 'all 0.15s',
          }}>{bypassed ? 'BYPASSED' : 'ACTIVE'}</button>
          <button onClick={() => setIsRecording(r => !r)} style={{
            font: 'var(--type-label)', padding: '3px 10px', borderRadius: 2, cursor: 'pointer',
            background: isRecording ? 'rgba(255,59,59,0.22)' : 'rgba(255,59,59,0.1)',
            color: '#FF3B3B',
            border: `1px solid rgba(255,59,59,${isRecording ? '0.65' : '0.35'})`,
            boxShadow: isRecording ? '0 0 10px rgba(255,59,59,0.45)' : 'none', transition: 'all 0.12s',
          }}>
            <span style={{ display: 'inline-block', animation: isRecording ? 'pulse-glow 1s ease-in-out infinite' : 'none' }}>●</span>
            {' '}{isRecording ? 'RECORDING' : 'REC'}
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden" style={{ opacity: bypassed ? 0.3 : 1, transition: 'opacity 0.3s', pointerEvents: bypassed ? 'none' : 'auto' }}>

        {/* ── Left: Pitch Graph ── */}
        <div style={{ flex: '0 0 440px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e1e1e', background: '#080808' }}>
          <div style={{ height: 28, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
            <span style={{ font: 'var(--type-status)', color: '#444' }}>PITCH GRAPH</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              {[{ label: 'INPUT', color: '#00BFFF' }, { label: 'OUTPUT', color: '#B7FF00' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 2, background: l.color, boxShadow: `0 0 4px ${l.color}` }} />
                  <span style={{ font: 'var(--type-micro)', color: '#444' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, background: '#0a0a0a', borderRight: '1px solid #1a1a1a', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
              {semitoneRows.map((row, i) => (
                <div key={i} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: row.isRoot ? 'rgba(183,255,0,0.06)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.02)',
                }}>
                  <span style={{ font: 'var(--type-micro)', color: row.isRoot ? '#B7FF00' : '#333', fontSize: 6 }}>{row.note}</span>
                </div>
              ))}
            </div>
            <svg width="100%" height="100%" viewBox="0 0 420 180" preserveAspectRatio="none"
              style={{ position: 'absolute', left: 24, top: 0, width: 'calc(100% - 24px)', height: '100%' }}>
              {semitoneRows.map((row, i) => (
                <line key={i} x1="0" y1={row.y} x2={420} y2={row.y}
                  stroke={row.isRoot ? 'rgba(183,255,0,0.12)' : 'rgba(255,255,255,0.025)'}
                  strokeWidth={row.isRoot ? 1 : 0.5} strokeDasharray={row.isRoot ? '' : '4 8'} />
              ))}
              <path d={pitchPath} fill="none" stroke="#00BFFF" strokeWidth={1.5} opacity={0.5}
                style={{ filter: 'drop-shadow(0 0 3px rgba(0,191,255,0.4))' }} />
              <path d={correctedPath} fill="none" stroke="#B7FF00" strokeWidth={2} opacity={0.85}
                style={{ filter: 'drop-shadow(0 0 4px rgba(183,255,0,0.5))' }} />
              <line x1={420 * 0.7} y1="0" x2={420 * 0.7} y2={180} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
            </svg>
          </div>

          <div style={{ height: 20, background: '#0c0c0c', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', paddingLeft: 28 }}>
            {KEYS.map((k, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', font: 'var(--type-micro)', fontSize: 7, color: k === selectedKey ? '#B7FF00' : '#2a2a2a' }}>{k}</div>
            ))}
          </div>
        </div>

        {/* ── Right: Signal Chain ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0a0a' }}>

          {/* Key / Scale / Reference / Live readouts — fixed */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'relative' }}>
            {/* Key */}
            <div style={{ position: 'relative' }}>
              <div style={{ font: 'var(--type-micro)', color: '#444', marginBottom: 3 }}>KEY</div>
              <button ref={keyBtnRef} onClick={() => { setShowKeyMenu(v => !v); setShowScaleMenu(false); }} style={{
                font: 'var(--type-label)', padding: '4px 10px', borderRadius: 2, cursor: 'pointer',
                background: 'rgba(183,255,0,0.06)', color: '#B7FF00',
                border: '1px solid rgba(183,255,0,0.3)', minWidth: 48,
              }}>{selectedKey} ▾</button>
              {showKeyMenu && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 30, marginTop: 2, background: '#111', border: '1px solid #2a2a2a', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.8)', display: 'flex', flexWrap: 'wrap', width: 120 }}>
                  {KEYS.map(k => (
                    <button key={k} onClick={() => { setKey(k); setShowKeyMenu(false); }} style={{ width: '33.33%', padding: '5px 0', textAlign: 'center', font: 'var(--type-label)', cursor: 'pointer', background: k === selectedKey ? 'rgba(183,255,0,0.12)' : 'transparent', color: k === selectedKey ? '#B7FF00' : '#666', border: 'none', borderBottom: '1px solid #1a1a1a', transition: 'all 0.1s' }}>{k}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Scale */}
            <div style={{ position: 'relative' }}>
              <div style={{ font: 'var(--type-micro)', color: '#444', marginBottom: 3 }}>SCALE</div>
              <button ref={scaleBtnRef} onClick={() => { setShowScaleMenu(v => !v); setShowKeyMenu(false); }} style={{ font: 'var(--type-label)', padding: '4px 10px', borderRadius: 2, cursor: 'pointer', background: 'rgba(0,191,255,0.06)', color: '#00BFFF', border: '1px solid rgba(0,191,255,0.3)', minWidth: 100 }}>{selectedScale} ▾</button>
              {showScaleMenu && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 30, marginTop: 2, background: '#111', border: '1px solid #2a2a2a', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                  {SCALES.map(s => (
                    <button key={s} onClick={() => { setScale(s); setShowScaleMenu(false); }} style={{ display: 'block', width: '100%', padding: '5px 12px', textAlign: 'left', font: 'var(--type-label)', cursor: 'pointer', background: s === selectedScale ? 'rgba(0,191,255,0.1)' : 'transparent', color: s === selectedScale ? '#00BFFF' : '#666', border: 'none', borderBottom: '1px solid #1a1a1a', whiteSpace: 'nowrap' }}>{s}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Reference */}
            <div>
              <div style={{ font: 'var(--type-micro)', color: '#444', marginBottom: 3 }}>REFERENCE</div>
              <div style={{ font: 'var(--type-label)', color: '#555', padding: '4px 10px', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 2 }}>440 Hz</div>
            </div>

            {/* Live readouts */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
              {[
                { label: 'PITCH',  value: `${Number(detectedOffset) > 0 ? '+' : ''}${detectedOffset} st`, color: Math.abs(Number(detectedOffset)) > 2 ? '#FF3B3B' : '#B7FF00' },
                { label: 'INPUT',  value: `${inputDb} dBFS`, color: '#555' },
                { label: 'CORR',   value: `${correctionPct}%`, color: '#00BFFF' },
              ].map(r => (
                <div key={r.label} style={{ textAlign: 'right' }}>
                  <div style={{ font: 'var(--type-micro)', color: '#333' }}>{r.label}</div>
                  <div style={{ font: 'var(--type-value)', color: r.color, fontSize: 11, textShadow: r.color !== '#555' ? `0 0 6px ${r.color}60` : 'none' }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Scrollable chain sections ── */}
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>

            {/* ═══ STEP 1 — PITCH CORRECTION ═══════════════════════════════ */}
            <div style={SECT}>
              <ChainStep num={1} label="PITCH CORRECTION" color="#B7FF00" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <Knob label="RETUNE"   size={48} color="#B7FF00" initialValue={retune}   onChange={setRetune} />
                <Knob label="HUMANIZE" size={48} color="#00BFFF" initialValue={humanize} onChange={setHumanize} />
                <Knob label="FORMANT"  size={48} color="#FF8C00" initialValue={formant}  onChange={setFormant} />
                <Knob label="MIX"      size={48} color="#BF5FFF" initialValue={mix}      onChange={setMix} />

                {/* Retune speed */}
                <div style={{ marginLeft: 'auto', padding: '10px 14px', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 2, minWidth: 110 }}>
                  <div style={{ font: 'var(--type-micro)', color: '#333', marginBottom: 4 }}>RETUNE SPEED</div>
                  <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${retune * 100}%`, background: '#B7FF00', boxShadow: 'var(--glow-green-1)', transition: 'width 0.2s' }} />
                  </div>
                  <div style={{ font: 'var(--type-status)', color: '#B7FF00', marginTop: 4 }}>
                    {retune < 0.3 ? 'NATURAL' : retune < 0.6 ? 'BALANCED' : retune < 0.85 ? 'TIGHT' : 'INSTANT'}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ STEP 3 — DE-ESSER ════════════════════════════════════════ */}
            <div style={{ ...SECT, opacity: deEsserActive ? 1 : 0.45, transition: 'opacity 0.2s' }}>
              <ChainStep num={3} label="DE-ESSER" color="#00BFFF" active={deEsserActive} onToggle={() => setDeEsserActive(a => !a)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Knob label="THRESH" size={40} color="#00BFFF" initialValue={deEsserThresh} onChange={setDeEsserThresh} defaultValue={0.52} />
                <Knob label="FREQ"   size={40} color="#00E5FF" initialValue={deEsserFreq}   onChange={setDeEsserFreq}   defaultValue={0.68} />

                {/* Sibilance band quick-set */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ font: 'var(--type-micro)', color: '#333', marginBottom: 2 }}>SIBILANCE</div>
                  {['4kHz', '8kHz', '12kHz'].map(f => (
                    <button key={f} onClick={() => {
                      setDeEsserBand(f);
                      setDeEsserFreq(f === '4kHz' ? 0.35 : f === '8kHz' ? 0.65 : 0.88);
                    }} style={{
                      font: 'var(--type-label)', fontSize: 8, padding: '2px 8px', borderRadius: 2, cursor: 'pointer',
                      background: deEsserBand === f ? 'rgba(0,191,255,0.15)' : 'rgba(255,255,255,0.02)',
                      color: deEsserBand === f ? '#00BFFF' : '#444',
                      border: `1px solid ${deEsserBand === f ? 'rgba(0,191,255,0.4)' : '#1e1e1e'}`,
                      transition: 'all 0.1s',
                    }}>{f}</button>
                  ))}
                </div>

                {/* GR meter */}
                <GRMeter value={deEsserActive ? esserGr : 0} color="#00BFFF" />

                {/* Frequency readout */}
                <div style={{ marginLeft: 'auto', padding: '10px 14px', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 2, minWidth: 90 }}>
                  <div style={{ font: 'var(--type-micro)', color: '#333', marginBottom: 4 }}>DETECT FREQ</div>
                  <div style={{ font: 'var(--type-value)', color: '#00BFFF', fontSize: 13 }}>
                    {Math.round(4000 + deEsserFreq * 12000).toLocaleString()} Hz
                  </div>
                  <div style={{ font: 'var(--type-micro)', color: '#444', marginTop: 2 }}>
                    GR: {-(esserGr * 12).toFixed(1)} dB
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ STEP 5 — DYNAMICS ════════════════════════════════════════ */}
            <div style={{ ...SECT, opacity: compActive ? 1 : 0.45, transition: 'opacity 0.2s' }}>
              <ChainStep num={5} label="DYNAMICS" color="#39FF14" active={compActive} onToggle={() => setCompActive(a => !a)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Knob label="THRESH"  size={40} color="#39FF14" initialValue={compThresh}  onChange={setCompThresh}  defaultValue={0.42} />
                <Knob label="RATIO"   size={40} color="#B7FF00" initialValue={compRatio}   onChange={setCompRatio}   defaultValue={0.45} />
                <Knob label="ATTACK"  size={40} color="#00BFFF" initialValue={compAttack}  onChange={setCompAttack}  defaultValue={0.22} />
                <Knob label="RELEASE" size={40} color="#FF8C00" initialValue={compRelease} onChange={setCompRelease} defaultValue={0.55} />

                {/* GR meter */}
                <GRMeter value={compActive ? compGr : 0} color="#39FF14" />

                {/* Compression readout */}
                <div style={{ marginLeft: 'auto', padding: '10px 14px', background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 2, minWidth: 110 }}>
                  <div style={{ font: 'var(--type-micro)', color: '#333', marginBottom: 4 }}>COMPRESSION</div>
                  <div style={{ font: 'var(--type-value)', color: '#39FF14', fontSize: 13 }}>
                    {(1 + compRatio * 9).toFixed(1)}:1
                  </div>
                  <div style={{ font: 'var(--type-micro)', color: '#444', marginTop: 2 }}>
                    THR: {(-60 + compThresh * 55).toFixed(0)} dB
                    &nbsp;·&nbsp;
                    GR: {-(compGr * 12).toFixed(1)} dB
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ PRESET BANK ══════════════════════════════════════════════ */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ font: 'var(--type-micro)', color: '#333', marginBottom: 8, letterSpacing: '0.1em' }}>PRESET BANK</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {PRESETS.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p)} style={{
                    padding: '8px 6px', borderRadius: 2, cursor: 'pointer',
                    font: 'var(--type-label)', fontSize: 9, letterSpacing: '0.06em',
                    background: selectedPreset === p.name ? 'rgba(183,255,0,0.1)' : 'rgba(255,255,255,0.02)',
                    color: selectedPreset === p.name ? '#B7FF00' : '#555',
                    border: `1px solid ${selectedPreset === p.name ? 'rgba(183,255,0,0.35)' : '#1e1e1e'}`,
                    boxShadow: selectedPreset === p.name ? 'var(--glow-green-1)' : 'none',
                    transition: 'all 0.12s',
                  }}>{p.name}</button>
                ))}
              </div>
            </div>

          </div>{/* end scrollable */}
        </div>
      </div>

      {/* ── Bypass overlay ── */}
      {bypassed && (
        <div style={{ position: 'absolute', inset: 0, top: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', zIndex: 20, pointerEvents: 'none' }}>
          <div style={{ font: 'var(--type-heading)', fontSize: 18, color: '#FF3B3B', letterSpacing: '0.3em', textShadow: 'var(--glow-red-2)' }}>BYPASSED</div>
        </div>
      )}
    </div>
  );
}
