import { useState } from 'react';
import { Knob } from './Knob';

const EFFECTS = [
  { name: 'COMPRESSOR', color: '#39FF14',  params: [{ l: 'THRESH', v: 0.4 }, { l: 'RATIO', v: 0.6 }, { l: 'ATTACK', v: 0.3 }, { l: 'RELEASE', v: 0.5 }] },
  { name: 'EQ-8',       color: '#00BFFF',  params: [{ l: 'LOW',    v: 0.5 }, { l: 'MID',   v: 0.5 }, { l: 'HIGH',   v: 0.6 }, { l: 'AIR',    v: 0.3 }] },
  { name: 'REVERB',     color: '#BF5FFF',  params: [{ l: 'SIZE',   v: 0.5 }, { l: 'DAMP',  v: 0.4 }, { l: 'DIFF',   v: 0.7 }, { l: 'PREDLY', v: 0.2 }] },
  { name: 'DELAY',      color: '#FF8C00',  params: [{ l: 'TIME',   v: 0.3 }, { l: 'FEED',  v: 0.5 }, { l: 'SYNC',   v: 0.8 }, { l: 'SPREAD', v: 0.4 }] },
  { name: 'CHORUS',     color: '#00BFFF',  params: [{ l: 'RATE',   v: 0.4 }, { l: 'DEPTH', v: 0.5 }, { l: 'DELAY',  v: 0.3 }, { l: 'MIX',    v: 0.5 }] },
  { name: 'DISTORTION', color: '#FF3B3B',  params: [{ l: 'DRIVE',  v: 0.7 }, { l: 'TONE',  v: 0.5 }, { l: 'CLIP',   v: 0.3 }, { l: 'MIX',    v: 0.6 }] },
  { name: 'LIMITER',    color: '#FFD700',  params: [{ l: 'THRESH', v: 0.8 }, { l: 'CEIL',  v: 0.9 }, { l: 'RELEASE',v: 0.3 }, { l: 'GAIN',   v: 0.5 }] },
  { name: 'MASTER GAIN',color: '#B7FF00',  params: [{ l: 'GAIN',   v: 0.8 }, { l: 'WIDTH', v: 0.5 }, { l: 'CLIP',   v: 0.9 }, { l: 'MONO',   v: 0.0 }] },
];

export function FxRackView() {
  const [bypassed, setBypassed] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setBypassed(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none" style={{ background: '#090909' }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-header-title">FX RACK</span>
        <span className="panel-header-meta">8 SLOTS · INSERT CHAIN</span>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-3 flex flex-col gap-2">
        {EFFECTS.map((fx, i) => {
          const byp = bypassed.has(i);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center',
              background: byp ? '#0a0a0a' : '#111',
              border: `1px solid ${byp ? '#1a1a1a' : fx.color + '40'}`,
              boxShadow: byp ? 'none' : `0 0 8px ${fx.color}18, inset 0 1px 0 rgba(255,255,255,0.04)`,
              borderRadius: 3, opacity: byp ? 0.45 : 1,
              transition: 'all 0.2s',
            }}>
              {/* Rack ear left */}
              <div style={{ width: 16, alignSelf: 'stretch', background: 'linear-gradient(90deg,#1a1a1a,#222)', borderRight: '1px solid #333', flexShrink: 0, borderRadius: '3px 0 0 3px' }} />

              {/* Power LED + Name */}
              <div style={{ width: 130, padding: '8px 10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: byp ? '#333' : fx.color, boxShadow: byp ? 'none' : `0 0 6px ${fx.color}` }} />
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, color: byp ? '#444' : '#ddd', letterSpacing: '0.08em' }}>{fx.name}</span>
                </div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#444', marginTop: 3 }}>SLOT {String(i+1).padStart(2,'0')}</div>
              </div>

              {/* Params */}
              <div style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'center', padding: '6px 12px' }}>
                {fx.params.map((p, j) => (
                  <Knob key={j} size={36} color={fx.color} initialValue={p.v} label={p.l} />
                ))}
              </div>

              {/* Wet/Dry */}
              <div style={{ padding: '0 12px', flexShrink: 0 }}>
                <Knob size={32} color="#888" initialValue={0.7} label="W/D" />
              </div>

              {/* Bypass button */}
              <div style={{ padding: '0 12px 0 0', flexShrink: 0 }}>
                <button
                  onClick={() => toggle(i)}
                  style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
                    padding: '4px 8px', cursor: 'pointer', borderRadius: 2,
                    background: byp ? 'rgba(255,59,59,0.15)' : 'transparent',
                    color: byp ? '#FF3B3B' : '#555',
                    border: `1px solid ${byp ? '#FF3B3B' : '#333'}`,
                  }}
                >{byp ? 'BYPASSED' : 'ACTIVE'}</button>
              </div>

              {/* Rack ear right */}
              <div style={{ width: 16, alignSelf: 'stretch', background: 'linear-gradient(270deg,#1a1a1a,#222)', borderLeft: '1px solid #333', flexShrink: 0, borderRadius: '0 3px 3px 0' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}