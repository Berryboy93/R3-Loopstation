import { useState } from 'react';
import { Knob } from './Knob';

// Signal chain ordered per industry-standard vocal/production workflow:
// Compressor → De-Esser → EQ → Reverb → Delay → Saturator → Limiter → Master Gain
//
// Parameter initial values are informed by:
//  - FabFilter Pro-C2 / Pro-L2 typical starting points (IMG_5133)
//  - Fruity Compressor vocal preset: Thresh -16dB, Ratio 3:1, Attack 5ms, Release 80ms (IMG_5122)
//  - Industry vocal chain reference (IMG_5141)

const EFFECTS = [
  {
    name: 'COMPRESSOR',
    color: '#39FF14',
    desc: 'CAPTURE PEAKS',
    // Vocals: Thresh ≈-16dB (0.42 in 0–1 range), Ratio 3:1 (0.45), Attack 5ms (0.22), Release 80ms (0.55)
    params: [{ l: 'THRESH', v: 0.42 }, { l: 'RATIO', v: 0.45 }, { l: 'ATTACK', v: 0.22 }, { l: 'RELEASE', v: 0.55 }],
  },
  {
    name: 'DE-ESSER',
    color: '#00BFFF',
    desc: 'TAME SIBILANCE',
    // Threshold controls sensitivity; FREQ targets sibilance range (8kHz default); RANGE = depth of cut; LISTEN = solo mode (off=0)
    params: [{ l: 'THRESH', v: 0.52 }, { l: 'FREQ', v: 0.68 }, { l: 'RANGE', v: 0.60 }, { l: 'LISTEN', v: 0.0 }],
  },
  {
    name: 'EQ-8',
    color: '#00BFFF',
    desc: 'SHAPE TONE',
    params: [{ l: 'LOW', v: 0.5 }, { l: 'MID', v: 0.5 }, { l: 'HIGH', v: 0.6 }, { l: 'AIR', v: 0.3 }],
  },
  {
    name: 'REVERB',
    color: '#BF5FFF',
    desc: 'ADD SPACE',
    // PRE-DLY: 20–40ms range (vocals guideline from IMG_5120); SIZE, DAMP, MIX per vocal starting points
    params: [{ l: 'SIZE', v: 0.50 }, { l: 'DAMP', v: 0.40 }, { l: 'PREDLY', v: 0.25 }, { l: 'MIX', v: 0.30 }],
  },
  {
    name: 'DELAY',
    color: '#FF8C00',
    desc: 'ADD WIDTH',
    params: [{ l: 'TIME', v: 0.3 }, { l: 'FEED', v: 0.5 }, { l: 'SYNC', v: 0.8 }, { l: 'SPREAD', v: 0.4 }],
  },
  {
    name: 'SATURATOR',
    color: '#FF8C00',
    desc: 'ADD WARMTH',
    // Even/Odd harmonic content — even harmonics = musical/warm, odd = harsh/gritty
    params: [{ l: 'DRIVE', v: 0.50 }, { l: 'TONE', v: 0.50 }, { l: 'EVEN', v: 0.55 }, { l: 'ODD', v: 0.35 }],
  },
  {
    name: 'LIMITER',
    color: '#FFD700',
    desc: 'CEILING CONTROL',
    // FabFilter Pro-L2 style: Threshold, Ceiling, Lookahead, Release (IMG_5133)
    params: [{ l: 'THRESH', v: 0.80 }, { l: 'CEIL', v: 0.95 }, { l: 'LKAHD', v: 0.20 }, { l: 'RELEASE', v: 0.25 }],
  },
  {
    name: 'MASTER GAIN',
    color: '#B7FF00',
    desc: 'OUTPUT STAGE',
    params: [{ l: 'GAIN', v: 0.80 }, { l: 'WIDTH', v: 0.50 }, { l: 'CLIP', v: 0.90 }, { l: 'MONO', v: 0.0 }],
  },
] as const;

export function FxRackView() {
  const [bypassed, setBypassed] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setBypassed(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

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

              {/* Power LED + Name + desc */}
              <div style={{ width: 140, padding: '8px 10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: byp ? '#333' : fx.color, boxShadow: byp ? 'none' : `0 0 6px ${fx.color}` }} />
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, color: byp ? '#444' : '#ddd', letterSpacing: '0.08em' }}>{fx.name}</span>
                </div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: '#383838', marginTop: 2 }}>
                  {String(i + 1).padStart(2, '0')} · {fx.desc}
                </div>
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

              {/* Bypass */}
              <div style={{ padding: '0 12px 0 0', flexShrink: 0 }}>
                <button onClick={() => toggle(i)} style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
                  padding: '4px 8px', cursor: 'pointer', borderRadius: 2,
                  background: byp ? 'rgba(255,59,59,0.15)' : 'transparent',
                  color: byp ? '#FF3B3B' : '#555',
                  border: `1px solid ${byp ? '#FF3B3B' : '#333'}`,
                }}>{byp ? 'BYPASSED' : 'ACTIVE'}</button>
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
