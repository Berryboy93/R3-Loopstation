import { useState, useRef, useEffect } from 'react';
import { Knob } from './Knob';

// Reverb types from "Three Components of Every Reverb Signal" reference
const REVERB_TYPES = ['ROOM', 'PLATE', 'HALL', 'CHAMBER', 'SPRING'] as const;
type ReverbType = typeof REVERB_TYPES[number];

// Default parameter values per reverb type (SIZE / DAMP / DIFF / MIX / PRE-DLY)
// Informed by industry-standard RT60 ranges and pre-delay guidelines
const REVERB_DEFAULTS: Record<ReverbType, [number, number, number, number, number]> = {
  ROOM:    [0.30, 0.55, 0.50, 0.30, 0.18],  // Small room: short decay, mid damping
  PLATE:   [0.45, 0.30, 0.75, 0.35, 0.12],  // Plate: dense, low damping, tight pre-delay
  HALL:    [0.60, 0.40, 0.70, 0.35, 0.25],  // Hall: large, long, wide diffusion
  CHAMBER: [0.50, 0.45, 0.65, 0.32, 0.22],  // Chamber: rich mid-range
  SPRING:  [0.38, 0.65, 0.55, 0.40, 0.08],  // Spring: vintage, high damping, no pre-delay
};

export function GlobalFX() {
  const [filterType,  setFilterType]  = useState('HPF');
  const [reverbOpen,  setReverbOpen]  = useState(false);
  const [reverbType,  setReverbType]  = useState<ReverbType>('HALL');

  // Reverb param state — seeded from HALL defaults
  const [rvSize,   setRvSize]   = useState(0.60);
  const [rvDamp,   setRvDamp]   = useState(0.40);
  const [rvDiff,   setRvDiff]   = useState(0.70);
  const [rvMix,    setRvMix]    = useState(0.35);
  const [rvPreDly, setRvPreDly] = useState(0.25);

  const applyReverbType = (t: ReverbType) => {
    setReverbType(t);
    const [sz, dm, df, mx, pd] = REVERB_DEFAULTS[t];
    setRvSize(sz); setRvDamp(dm); setRvDiff(df); setRvMix(mx); setRvPreDly(pd);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => { e.preventDefault(); el.scrollTop += e.deltaY; };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  // Pre-delay ms readout (0–100 ms range, industry-standard starting points)
  const preDlyMs = Math.round(rvPreDly * 100);

  return (
    <div
      ref={scrollRef}
      className="w-[160px] glass-panel laser-green flex flex-col shrink-0 overflow-y-auto overflow-x-hidden pb-4 select-none"
      style={{ borderTop: 'none', borderBottom: 'none', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`.w-\\[160px\\]::-webkit-scrollbar { display: none; }`}</style>

      {/* ── Header ── */}
      <div className="h-8 flex items-center justify-between px-3 sticky top-0 z-10 glass-panel" style={{ border: 'none', borderBottom: '1px solid rgba(183,255,0,0.3)', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
        <span className="text-[10px] font-bold text-white tracking-widest" style={{ fontFamily: "'Rajdhani', sans-serif" }}>GLOBAL FX</span>
        <div className="w-2 h-2 rounded-full bg-[#B7FF00] shadow-[0_0_5px_rgba(183,255,0,0.5)]" />
      </div>

      {/* ── Filter ── */}
      <div className="p-3">
        <div className="flex justify-between mb-4">
          <Knob label="FILTER" size={52} color="#00BFFF" initialValue={0.3} />
          <Knob label="RESO"   size={36} color="#00E5FF" initialValue={0.6} />
        </div>
        <div className="flex bg-[#0a0a0a] border border-[#222] rounded-sm overflow-hidden" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)' }}>
          {['HPF', 'BPF', 'LPF'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`flex-1 text-[9px] py-1 font-bold ${filterType === t ? 'bg-[#00BFFF] text-black shadow-[0_0_8px_rgba(0,191,255,0.6)]' : 'text-[#888] hover:text-white hover:bg-[#222]'}`}
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >{t}</button>
          ))}
        </div>
      </div>
      <div className="section-divider" />

      {/* ── Multi FX ── */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, fontWeight: 700, color: '#555', letterSpacing: '0.12em' }}>DELAY</span>
          <Knob size={24} color="#FF8C00" initialValue={0.4} />
        </div>
        <div className="flex justify-between mb-4">
          <Knob label="REVERB" size={34} color="#BF5FFF" initialValue={0.2} />
          <Knob label="DRIVE"  size={34} color="#FF3B3B" initialValue={0.8} />
          <Knob label="CHORUS" size={34} color="#00BFFF" initialValue={0.0} />
        </div>
        <div className="flex justify-between mb-2">
          <Knob label="FLANGER" size={30} color="#FF8C00" initialValue={0.0} />
          <Knob label="PHASER"  size={30} color="#FFD700" initialValue={0.0} />
          <Knob label="PITCH"   size={30} color="#B7FF00" initialValue={0.5} />
        </div>
      </div>
      <div className="section-divider" />

      {/* ── LFO ── */}
      <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex justify-between">
          <Knob label="RATE"  valueDisplay="5D"  size={34} color="#B7FF00" initialValue={0.7}  />
          <Knob label="TIME"  valueDisplay="1/4" size={34} color="#B7FF00" initialValue={0.25} />
          <Knob label="SHAKE" valueDisplay="5D"  size={34} color="#B7FF00" initialValue={0.1}  />
        </div>
      </div>
      <div className="section-divider" />

      {/* ── Delay Detail ── */}
      <div className="p-3">
        <div className="text-[9px] text-[#888] font-bold mb-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>DELAY</div>
        <div className="flex justify-between">
          <Knob label="T.DLY" size={30} color="#FF8C00" initialValue={0.3} />
          <Knob label="MIX"   size={30} color="#FF8C00" initialValue={0.5} />
          <Knob label="FEED"  size={30} color="#FF8C00" initialValue={0.6} />
        </div>
      </div>
      <div className="section-divider" />

      {/* ── Reverb — collapsible with TYPE + PRE-DLY ── */}
      <button
        onClick={() => setReverbOpen(o => !o)}
        className="w-full p-3 flex items-center justify-between hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors"
        style={{ background: 'transparent', border: 'none', borderTop: '1px solid rgba(183,255,0,0.08)' }}
      >
        <div className="text-[9px] text-[#888] font-bold" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          REVERB
          {reverbOpen && (
            <span style={{ color: '#BF5FFF', marginLeft: 6, fontSize: 7, fontWeight: 400 }}>{reverbType}</span>
          )}
        </div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"
          style={{ transform: reverbOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {reverbOpen && (
        <div className="px-3 pb-3">
          {/* ── Reverb TYPE selector ── */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: '#444', letterSpacing: '0.1em', marginBottom: 5 }}>TYPE</div>
            <div style={{ display: 'flex', gap: 2 }}>
              {REVERB_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => applyReverbType(t)}
                  style={{
                    flex: 1, fontFamily: "'Share Tech Mono', monospace", fontSize: 7, padding: '3px 0',
                    cursor: 'pointer', borderRadius: 2, transition: 'all 0.12s',
                    background: reverbType === t ? 'rgba(191,95,255,0.18)' : 'rgba(255,255,255,0.02)',
                    color: reverbType === t ? '#BF5FFF' : '#444',
                    border: `1px solid ${reverbType === t ? 'rgba(191,95,255,0.45)' : '#1e1e1e'}`,
                    boxShadow: reverbType === t ? '0 0 6px rgba(191,95,255,0.2)' : 'none',
                  }}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* ── Row 1: PRE-DLY / SIZE / DAMP ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Knob
                label="PRE-DLY"
                size={28}
                color="#BF5FFF"
                initialValue={rvPreDly}
                onChange={setRvPreDly}
                defaultValue={REVERB_DEFAULTS[reverbType][4]}
              />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: '#BF5FFF99' }}>{preDlyMs}ms</span>
            </div>
            <Knob label="SIZE" size={28} color="#BF5FFF" initialValue={rvSize} onChange={setRvSize} defaultValue={REVERB_DEFAULTS[reverbType][0]} />
            <Knob label="DAMP" size={28} color="#BF5FFF" initialValue={rvDamp} onChange={setRvDamp} defaultValue={REVERB_DEFAULTS[reverbType][1]} />
          </div>

          {/* ── Row 2: DIFF / MIX ── */}
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <Knob label="DIFF" size={28} color="#BF5FFF" initialValue={rvDiff} onChange={setRvDiff} defaultValue={REVERB_DEFAULTS[reverbType][2]} />
            <Knob label="MIX"  size={28} color="#BF5FFF" initialValue={rvMix}  onChange={setRvMix}  defaultValue={REVERB_DEFAULTS[reverbType][3]} />
          </div>
        </div>
      )}
    </div>
  );
}
