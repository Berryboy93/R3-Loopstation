import { useState, useRef, useEffect, useCallback } from 'react';

interface HeaderProps {
  bpm: number;
  setBpm: (v: number) => void;
}

export function Header({ bpm, setBpm }: HeaderProps) {
  const [isPlaying, setIsPlaying]   = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [quantize, setQuantize]     = useState(true);
  const [limit, setLimit]           = useState(false);
  const [mono, setMono]             = useState(false);
  const [meteo, setMeteo]           = useState(false);
  const [grain, setGrain]           = useState(false);
  // Top-right action buttons — wired to local state so they react visually
  const [isDark,       setIsDark]       = useState(true);
  const [isSikk,       setIsSikk]       = useState(false);
  const [isLinked,     setIsLinked]     = useState(false);
  const [signOutFlash, setSignOutFlash] = useState(false);

  // VU meter — animated via rAF, NOT Math.random() in render
  const [vuLevels, setVuLevels]     = useState<number[]>(Array(8).fill(0));
  const vuTimeRef  = useRef(Math.random() * 100);
  const vuRafRef   = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      vuTimeRef.current += 0.06;
      const t = vuTimeRef.current;
      setVuLevels(prev => prev.map((_, i) => {
        const phase = t * 0.8 + i * 0.7;
        const base  = Math.sin(phase) * 0.35 + 0.55;
        const noise = (Math.random() - 0.5) * 0.2;
        return Math.max(0, Math.min(1, base + noise));
      }));
      vuRafRef.current = requestAnimationFrame(tick);
    };
    vuRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(vuRafRef.current);
  }, []);

  // TAP TEMPO — track last 4 tap timestamps, compute average interval
  const tapTimesRef = useRef<number[]>([]);
  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    taps.push(now);
    // Keep only last 4 taps within 3 seconds
    const recent = taps.filter(t => now - t < 3000);
    tapTimesRef.current = recent;
    if (recent.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < recent.length; i++) intervals.push(recent[i] - recent[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const computed = Math.round(60000 / avg);
      setBpm(Math.max(40, Math.min(280, computed)));
    }
  }, [setBpm]);

  const [hoveredNudge, setHoveredNudge] = useState<number | null>(null);
  const adjustBpm = (delta: number) =>
    setBpm(Math.max(40, Math.min(280, bpm + delta)));

  return (
    <div
      className="h-[60px] flex items-center px-4 justify-between shrink-0 select-none"
      style={{
        background: '#0d0d0d',
        borderBottom: '1px solid rgba(183,255,0,0.18)',
      }}
    >
      {/* ── Logo + Transport ── */}
      <div className="flex items-center gap-5">
        <div className="flex flex-col">
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
            R3<span style={{ color: '#B7FF00' }}>/</span>LOOP
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: '#666', fontStyle: 'italic', marginTop: 2 }}>
            BY DJ ERNESTO <span style={{ color: '#B7FF00' }}>Native</span>
          </div>
        </div>

        {/* Transport buttons */}
        <div className="flex items-center gap-[3px] p-[3px] rounded-sm" style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)' }}>
          <button
            onClick={() => setIsPlaying(true)}
            style={{
              width: 32, height: 28, borderRadius: 3,
              background: isPlaying ? '#B7FF00' : 'rgba(255,255,255,0.03)',
              color: isPlaying ? '#000' : '#666',
              border: isPlaying ? 'none' : '1px solid rgba(255,255,255,0.06)',
              boxShadow: isPlaying ? '0 0 10px rgba(183,255,0,0.5), inset 0 1px 2px rgba(255,255,255,0.6)' : 'none',
              cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.1s',
            }}
          >▶</button>
          <button
            onClick={() => setIsPlaying(false)}
            style={{
              width: 32, height: 28, borderRadius: 3,
              background: !isPlaying ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
              color: !isPlaying ? '#fff' : '#555',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.1s',
            }}
          >■</button>
          <button
            onClick={() => setIsRecording(r => !r)}
            style={{
              width: 32, height: 28, borderRadius: 3,
              background: isRecording ? '#FF3B3B' : 'rgba(255,255,255,0.03)',
              color: isRecording ? '#fff' : '#666',
              border: isRecording ? 'none' : '1px solid rgba(255,255,255,0.06)',
              boxShadow: isRecording ? '0 0 10px rgba(255,59,59,0.5)' : 'none',
              cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.1s',
            }}
          >●</button>
        </div>
      </div>

      {/* ── BPM + Timing ── */}
      <div className="flex items-center gap-3 h-full px-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        {/* BPM display */}
        <div className="flex flex-col items-center">
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 40, lineHeight: 1, color: '#B7FF00',
            textShadow: '0 0 12px rgba(183,255,0,0.6), 0 0 24px rgba(183,255,0,0.25)',
            letterSpacing: '-0.03em',
          }}>{bpm}</span>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: '#444', fontWeight: 600, letterSpacing: '0.15em' }}>BPM</span>
        </div>

        {/* TAP + nudge buttons */}
        <div className="flex flex-col gap-1">
          <button
            onClick={handleTap}
            style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
              padding: '3px 8px', background: 'rgba(183,255,0,0.06)',
              color: '#B7FF00', border: '1px solid rgba(183,255,0,0.25)',
              borderRadius: 2, cursor: 'pointer',
              boxShadow: '0 0 4px rgba(183,255,0,0.1)',
              transition: 'all 0.08s',
            }}
          >TAP</button>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 7, color: '#333', textAlign: 'center', letterSpacing: '0.1em' }}>TEMPO</span>
        </div>

        {/* ±1 ±2 nudge */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-[3px]">
            {([-2, -1, 1, 2] as const).map(n => (
              <button
                key={n}
                onClick={() => adjustBpm(n)}
                onMouseEnter={() => setHoveredNudge(n)}
                onMouseLeave={() => setHoveredNudge(null)}
                style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
                  width: 24, height: 18,
                  background: 'rgba(255,255,255,0.03)',
                  color: hoveredNudge === n ? '#B7FF00' : '#555',
                  border: `1px solid ${hoveredNudge === n ? 'rgba(183,255,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 2, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.08s',
                }}
              >{n > 0 ? `+${n}` : n}</button>
            ))}
          </div>

          {/* Quantize + swing row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF8C00', boxShadow: '0 0 5px rgba(255,140,0,0.8)' }} />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: '#FF8C00' }}>SWING</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: '#444' }}>4/4</span>
            </div>
            <div className="flex items-center gap-1">
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: quantize ? '#B7FF00' : '#333', boxShadow: quantize ? '0 0 5px rgba(183,255,0,0.8)' : 'none' }} />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: quantize ? '#B7FF00' : '#444' }}>QUANTIZE</span>
              <button
                onClick={() => setQuantize(q => !q)}
                style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 7,
                  padding: '1px 4px', background: '#111', color: '#888',
                  border: '1px solid #222', borderRadius: 1, cursor: 'pointer',
                }}
              >1/4</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Global Controls ── */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-[5px]">
          <div className="flex gap-1">
            {[
              { label: 'METEO', active: meteo,  toggle: () => setMeteo(v => !v), color: '#B7FF00' },
              { label: 'MONO',  active: mono,   toggle: () => setMono(v => !v),  color: '#B7FF00' },
              { label: 'LIMITER', active: limit, toggle: () => setLimit(v => !v), color: '#FF3B3B' },
              { label: 'GRAIN', active: grain,  toggle: () => setGrain(v => !v), color: '#FF8C00' },
            ].map(({ label, active, toggle, color }) => (
              <button
                key={label}
                onClick={toggle}
                style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
                  padding: '3px 7px', borderRadius: 2, cursor: 'pointer',
                  background: active ? `${color}14` : 'rgba(255,255,255,0.03)',
                  color: active ? color : '#555',
                  border: `1px solid ${active ? color + '60' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: active ? `0 0 8px ${color}30` : 'none',
                  textShadow: active ? `0 0 8px ${color}` : 'none',
                  transition: 'all 0.12s',
                }}
              >{label}</button>
            ))}
          </div>
          <div className="flex justify-between items-center px-[2px]">
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: '#333' }}>L.M</span>
            <button
              onClick={() => setIsLinked(l => !l)}
              style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, padding: '1px 6px', borderRadius: 2, cursor: 'pointer', transition: 'all 0.12s',
                color: isLinked ? '#080808' : '#B7FF00',
                background: isLinked ? '#B7FF00' : 'rgba(183,255,0,0.06)',
                border: `1px solid ${isLinked ? '#B7FF00' : 'rgba(183,255,0,0.2)'}`,
                boxShadow: isLinked ? '0 0 8px rgba(183,255,0,0.5)' : 'none',
              }}
            >LINK</button>
          </div>
        </div>

        {/* VU Meter — driven by rAF state, no Math.random() in render */}
        <div className="flex gap-[2px] h-9 p-[3px] rounded-sm" style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)' }}>
          {vuLevels.map((lvl, i) => (
            <div key={i} className="flex flex-col justify-end w-[7px] gap-[1px]">
              {Array.from({ length: 10 }).map((_, j) => {
                const ledPos = 1 - j / 10;
                const active = ledPos <= lvl;
                const color  = j < 2 ? '#FF3B3B' : j < 4 ? '#FF8C00' : '#39FF14';
                return (
                  <div key={j} style={{
                    flex: 1, borderRadius: 1,
                    background: active ? color : '#1a1a1a',
                    boxShadow: active ? `0 0 3px ${color}80` : 'none',
                    transition: 'background 30ms, box-shadow 30ms',
                  }} />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── User Actions + Avatar ── */}
      <div className="flex items-center gap-3 h-full pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex flex-col gap-[5px]">
          <div className="flex gap-1">
            <button
              onClick={() => setIsDark(d => !d)}
              style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, padding: '3px 7px', borderRadius: 2, cursor: 'pointer', transition: 'all 0.12s',
                background: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: isDark ? '#fff' : '#555',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
              }}
            >● DARK</button>
            <button
              onClick={() => setIsSikk(s => !s)}
              style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, padding: '3px 7px', borderRadius: 2, cursor: 'pointer', transition: 'all 0.12s',
                background: isSikk ? 'rgba(183,255,0,0.1)' : 'transparent',
                color: isSikk ? '#B7FF00' : '#555',
                border: `1px solid ${isSikk ? 'rgba(183,255,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                textShadow: isSikk ? '0 0 8px rgba(183,255,0,0.7)' : 'none',
              }}
            >⟳ SIKK</button>
          </div>
          <button
            onClick={() => { setSignOutFlash(true); setTimeout(() => setSignOutFlash(false), 1000); }}
            style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 8, background: 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'right', transition: 'color 0.12s',
              color: signOutFlash ? '#B7FF00' : '#444',
              textShadow: signOutFlash ? '0 0 8px rgba(183,255,0,0.5)' : 'none',
            }}
          >{signOutFlash ? '✓ SIGNED OUT' : 'SIGN OUT'}</button>
        </div>

        {/* R3 avatar circle */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          border: '2px solid rgba(183,255,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, color: '#B7FF00',
          background: 'radial-gradient(circle at 35% 35%, #222, #0d0d0d)',
          boxShadow: '0 0 12px rgba(183,255,0,0.25), inset 0 0 8px rgba(183,255,0,0.1)',
          flexShrink: 0,
        }}>R3</div>
      </div>
    </div>
  );
}
