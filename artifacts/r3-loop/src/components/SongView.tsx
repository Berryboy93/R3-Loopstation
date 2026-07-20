import { useState, useEffect, useRef } from 'react';

const TRACKS = [
  { name: 'LOOP 1 — DRUMS', color: '#39FF14', clips: [{bar:1,len:8},{bar:17,len:8},{bar:25,len:8}] },
  { name: 'LOOP 2 — BASS',  color: '#00BFFF', clips: [{bar:1,len:4},{bar:9,len:8},{bar:21,len:4}] },
  { name: 'LOOP 3 — LEAD',  color: '#FF8C00', clips: [{bar:5,len:12},{bar:21,len:8}] },
  { name: 'LOOP 4 — PAD',   color: '#BF5FFF', clips: [{bar:1,len:16},{bar:25,len:8}] },
  { name: 'FX SEND A',      color: '#FF3B3B', clips: [{bar:9,len:4},{bar:17,len:4}] },
  { name: 'FX SEND B',      color: '#FFD700', clips: [{bar:13,len:4},{bar:25,len:4}] },
  { name: 'MASTER BUS',     color: '#B7FF00', clips: [{bar:1,len:32}] },
  { name: 'AUTOMATION',     color: '#FF69B4', clips: [{bar:1,len:32}] },
];
const TOTAL_BARS = 32;
const BAR_WIDTH = 32;

interface SongViewProps {
  bpm?: number;
}

export function SongView({ bpm = 120 }: SongViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(1);
  const [loopOn, setLoopOn] = useState(true);
  const loopStart = 9;
  const loopEnd = 17;
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const playheadRef = useRef<number>(1);

  useEffect(() => {
    if (isPlaying) {
      // 1 bar = 4 beats at BPM; ms per bar = 60000 / bpm * 4
      const msPerBar = Math.round((60000 / bpm) * 4);
      const step = (ts: number) => {
        if (lastTimeRef.current === 0) lastTimeRef.current = ts;
        const elapsed = ts - lastTimeRef.current;
        if (elapsed > msPerBar) {
          lastTimeRef.current = ts;
          playheadRef.current = playheadRef.current >= TOTAL_BARS ? 1 : playheadRef.current + 1;
          if (loopOn && playheadRef.current >= loopEnd) playheadRef.current = loopStart;
          setPlayhead(playheadRef.current);
        }
        rafRef.current = requestAnimationFrame(step);
      };
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(step);
    } else {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, loopOn, bpm]);

  const togglePlay = () => {
    if (!isPlaying) { playheadRef.current = playhead; }
    setIsPlaying(p => !p);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none" style={{ background: '#090909' }}>
      {/* Transport strip */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="panel-header-title">SONG</span>

          <button onClick={togglePlay} style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: '2px 10px',
            background: isPlaying ? '#B7FF00' : 'rgba(183,255,0,0.08)',
            color: isPlaying ? '#000' : '#888',
            border: `1px solid ${isPlaying ? '#B7FF00' : '#333'}`,
            boxShadow: isPlaying ? '0 0 8px rgba(183,255,0,0.5)' : 'none',
            cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s',
          }}>{isPlaying ? '■ STOP' : '▶ PLAY'}</button>

          <button onClick={() => setLoopOn(l => !l)} style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: '2px 8px',
            background: loopOn ? 'rgba(255,140,0,0.12)' : 'transparent',
            color: loopOn ? '#FF8C00' : '#444',
            border: `1px solid ${loopOn ? '#FF8C00' : '#2a2a2a'}`,
            cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s',
          }}>⟳ LOOP</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: isPlaying ? '#B7FF00' : '#333', boxShadow: isPlaying ? '0 0 6px rgba(183,255,0,0.8)' : 'none', transition: 'all 0.2s' }} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#555' }}>BAR {playhead}/{TOTAL_BARS}</span>
          </div>
        </div>

        <span className="panel-header-meta">{bpm} BPM · 4/4</span>
      </div>

      {/* Main arrangement area */}
      <div className="flex flex-1 overflow-auto [&::-webkit-scrollbar]:hidden">
        {/* Track labels */}
        <div style={{ width: 140, flexShrink: 0, borderRight: '1px solid #1e1e1e' }}>
          <div style={{ height: 24, background: '#111', borderBottom: '1px solid #222' }} />
          {TRACKS.map((t, i) => (
            <div key={i} style={{
              height: 48, display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 10px', borderBottom: '1px solid #161616',
              background: i % 2 === 0 ? '#0c0c0c' : '#0a0a0a',
            }}>
              <div style={{ width: 3, height: 28, borderRadius: 2, background: t.color, boxShadow: `0 0 6px ${t.color}70`, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', position: 'relative' }}>
          {/* Ruler */}
          <div style={{
            height: 24, background: '#111', borderBottom: '1px solid #222',
            display: 'flex', alignItems: 'center',
            position: 'sticky', top: 0, zIndex: 10,
            width: TOTAL_BARS * BAR_WIDTH, minWidth: '100%',
          }}>
            {Array.from({ length: TOTAL_BARS }).map((_, b) => (
              <div key={b} style={{
                width: BAR_WIDTH, flexShrink: 0,
                borderRight: `1px solid ${(b+1) % 4 === 0 ? '#2a2a2a' : '#161616'}`,
                display: 'flex', alignItems: 'center', paddingLeft: 3,
                background: (b+1) === playhead ? 'rgba(183,255,0,0.04)' : 'transparent',
              }}>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: (b+1) % 4 === 1 ? '#444' : '#1e1e1e' }}>{b+1}</span>
              </div>
            ))}
          </div>

          {/* Track rows */}
          <div style={{ position: 'relative', width: TOTAL_BARS * BAR_WIDTH, minWidth: '100%' }}>
            {/* Loop region */}
            {loopOn && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: (loopStart - 1) * BAR_WIDTH,
                width: (loopEnd - loopStart) * BAR_WIDTH,
                background: 'rgba(255,140,0,0.04)',
                borderLeft: '1px solid rgba(255,140,0,0.35)',
                borderRight: '1px solid rgba(255,140,0,0.35)',
                pointerEvents: 'none', zIndex: 1,
              }} />
            )}

            {/* Playhead line */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: (playhead - 1) * BAR_WIDTH,
              width: 1,
              background: '#B7FF00',
              boxShadow: '0 0 8px rgba(183,255,0,0.9)',
              pointerEvents: 'none', zIndex: 6,
              transition: isPlaying ? 'none' : 'left 0.2s',
            }} />

            {TRACKS.map((t, ri) => (
              <div key={ri} style={{
                height: 48, position: 'relative',
                borderBottom: '1px solid #141414',
                background: ri % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
              }}>
                {/* Bar grid lines */}
                {Array.from({ length: TOTAL_BARS }).map((_, b) => (
                  <div key={b} style={{
                    position: 'absolute', top: 0, bottom: 0, left: b * BAR_WIDTH, width: 1,
                    background: b % 4 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.015)',
                    pointerEvents: 'none',
                  }} />
                ))}

                {/* Clips */}
                {t.clips.map((clip, ci) => (
                  <div key={ci} style={{
                    position: 'absolute', top: 5, bottom: 5,
                    left: (clip.bar - 1) * BAR_WIDTH + 1,
                    width: clip.len * BAR_WIDTH - 2,
                    background: `${t.color}1A`,
                    border: `1px solid ${t.color}55`,
                    borderRadius: 2,
                    boxShadow: `0 0 5px ${t.color}15`,
                    backgroundImage: `repeating-linear-gradient(90deg, ${t.color}15 0px, ${t.color}15 1px, transparent 1px, transparent ${BAR_WIDTH / 4}px)`,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}>
                    <span style={{ position: 'absolute', top: 2, left: 4, fontFamily: "'Share Tech Mono',monospace", fontSize: 6, color: t.color, opacity: 0.6 }}>
                      {t.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
