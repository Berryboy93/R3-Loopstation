import { useState } from 'react';

const TRACKS = [
  { name: 'LOOP 1 — DRUMS',  color: '#39FF14', clips: [{bar:1,len:8},{bar:17,len:8},{bar:25,len:8}] },
  { name: 'LOOP 2 — BASS',   color: '#00BFFF', clips: [{bar:1,len:4},{bar:9,len:8},{bar:21,len:4}] },
  { name: 'LOOP 3 — LEAD',   color: '#FF8C00', clips: [{bar:5,len:12},{bar:21,len:8}] },
  { name: 'LOOP 4 — PAD',    color: '#BF5FFF', clips: [{bar:1,len:16},{bar:25,len:8}] },
  { name: 'FX SEND A',       color: '#FF3B3B', clips: [{bar:9,len:4},{bar:17,len:4}] },
  { name: 'FX SEND B',       color: '#FFD700', clips: [{bar:13,len:4},{bar:25,len:4}] },
  { name: 'MASTER BUS',      color: '#B7FF00', clips: [{bar:1,len:32}] },
  { name: 'AUTOMATION',      color: '#FF69B4', clips: [{bar:1,len:32}] },
];
const TOTAL_BARS = 32;
const BAR_WIDTH = 32; // px per bar

export function SongView() {
  const [loopStart] = useState(9);
  const [loopEnd] = useState(17);
  const [loopOn, setLoopOn] = useState(true);
  const [playhead] = useState(5);

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none" style={{ background: '#090909' }}>
      {/* Transport strip */}
      <div className="h-8 flex items-center gap-4 px-4 shrink-0" style={{ background: '#111', borderBottom: '1px solid #222' }}>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.12em' }}>SONG</span>
        <button style={{
          fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: '2px 8px',
          background: 'rgba(183,255,0,0.1)', color: '#B7FF00',
          border: '1px solid rgba(183,255,0,0.4)', cursor: 'pointer', borderRadius: 2,
        }}>▶ PLAY</button>
        <button
          onClick={() => setLoopOn(l => !l)}
          style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: '2px 8px',
            background: loopOn ? 'rgba(255,140,0,0.15)' : 'transparent',
            color: loopOn ? '#FF8C00' : '#555',
            border: `1px solid ${loopOn ? '#FF8C00' : '#333'}`, cursor: 'pointer', borderRadius: 2,
          }}
        >⟳ LOOP</button>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#555' }}>BAR {playhead} / {TOTAL_BARS}</span>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#333', marginLeft: 'auto' }}>120 BPM · 4/4</span>
      </div>

      <div className="flex flex-1 overflow-auto [&::-webkit-scrollbar]:hidden">
        {/* Track labels column */}
        <div style={{ width: 140, flexShrink: 0, borderRight: '1px solid #222' }}>
          {/* Ruler spacer */}
          <div style={{ height: 24, background: '#111', borderBottom: '1px solid #222' }} />
          {TRACKS.map((t, i) => (
            <div key={i} style={{
              height: 48, display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 10px', borderBottom: '1px solid #1a1a1a',
              background: i % 2 === 0 ? '#0c0c0c' : '#0a0a0a',
            }}>
              <div style={{ width: 3, height: 28, borderRadius: 2, background: t.color, boxShadow: `0 0 6px ${t.color}80`, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
            </div>
          ))}
        </div>

        {/* Timeline grid */}
        <div style={{ flex: 1, overflowX: 'auto', position: 'relative' }}>
          {/* Ruler */}
          <div style={{ height: 24, background: '#111', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, width: TOTAL_BARS * BAR_WIDTH }}>
            {Array.from({ length: TOTAL_BARS }).map((_, b) => (
              <div key={b} style={{ width: BAR_WIDTH, flexShrink: 0, borderRight: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: (b+1) % 4 === 1 ? '#555' : '#2a2a2a' }}>{b+1}</span>
              </div>
            ))}
          </div>

          {/* Track rows */}
          <div style={{ position: 'relative', width: TOTAL_BARS * BAR_WIDTH }}>
            {/* Loop region */}
            {loopOn && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: (loopStart - 1) * BAR_WIDTH, width: (loopEnd - loopStart) * BAR_WIDTH,
                background: 'rgba(255,140,0,0.06)', borderLeft: '1px solid rgba(255,140,0,0.4)', borderRight: '1px solid rgba(255,140,0,0.4)',
                pointerEvents: 'none', zIndex: 1,
              }} />
            )}

            {/* Playhead */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: (playhead - 1) * BAR_WIDTH, width: 1,
              background: '#B7FF00', boxShadow: '0 0 6px rgba(183,255,0,0.8)',
              pointerEvents: 'none', zIndex: 5,
            }} />

            {TRACKS.map((t, ri) => (
              <div key={ri} style={{
                height: 48, position: 'relative',
                borderBottom: '1px solid #1a1a1a',
                background: ri % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
              }}>
                {/* Beat grid */}
                {Array.from({ length: TOTAL_BARS }).map((_, b) => (
                  <div key={b} style={{
                    position: 'absolute', top: 0, bottom: 0, left: b * BAR_WIDTH, width: 1,
                    background: (b) % 4 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  }} />
                ))}

                {/* Clips */}
                {t.clips.map((clip, ci) => (
                  <div key={ci} style={{
                    position: 'absolute', top: 6, bottom: 6,
                    left: (clip.bar - 1) * BAR_WIDTH + 1,
                    width: clip.len * BAR_WIDTH - 2,
                    background: `${t.color}22`,
                    border: `1px solid ${t.color}60`,
                    borderRadius: 2,
                    boxShadow: `0 0 6px ${t.color}18`,
                    backgroundImage: `repeating-linear-gradient(90deg, ${t.color}18 0px, ${t.color}18 1px, transparent 1px, transparent ${BAR_WIDTH/4}px)`,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}>
                    <div style={{ position: 'absolute', top: 2, left: 4, fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: t.color, opacity: 0.7 }}>
                      {t.name.split(' ')[0]}
                    </div>
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