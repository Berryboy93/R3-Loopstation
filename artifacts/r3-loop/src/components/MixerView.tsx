import { useState, useMemo } from 'react';
import { Knob } from './Knob';
import { Fader } from './Fader';

const CHANNEL_COLORS = ['#39FF14','#00BFFF','#FF8C00','#BF5FFF','#39FF14','#00BFFF','#FF8C00','#BF5FFF'];
const CHANNEL_NAMES = ['DRUMS','BASS','LEAD','PAD','SYNTH','FX SND','VOX','AUX'];

export function MixerView() {
  const [soloChannel, setSoloChannel] = useState<number|null>(null);
  const [mutedChannels, setMutedChannels] = useState<Set<number>>(new Set());

  // Pre-compute random initial fader values ONCE (not on every render)
  const initialFaderValues = useMemo(() =>
    Array.from({ length: 8 }, () => 0.72 + Math.random() * 0.08),
  []);

  const toggleMute = (i: number) => setMutedChannels(prev => {
    const s = new Set(prev);
    s.has(i) ? s.delete(i) : s.add(i);
    return s;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none" style={{ background: '#0a0a0a' }}>
      {/* Header strip */}
      <div className="panel-header">
        <span className="panel-header-title">MIXER</span>
        <div className="flex items-center gap-4">
          <span className="panel-header-meta">8 CHANNELS + MASTER</span>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39FF14', boxShadow: 'var(--glow-green-1)' }} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#39FF14' }}>STEREO OUT</span>
          </div>
        </div>
      </div>

      {/* Channel strips — horizontally scrollable */}
      <div className="flex-1 flex overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: 8 }).map((_, i) => {
          const color = CHANNEL_COLORS[i];
          const muted = mutedChannels.has(i);
          const soloed = soloChannel === i;
          return (
            <div key={i} className="flex flex-col items-center shrink-0" style={{
              width: 80,
              borderRight: '1px solid #1a1a1a',
              background: muted ? 'rgba(0,0,0,0.6)' : '#0c0c0c',
              opacity: soloChannel !== null && !soloed ? 0.35 : 1,
              transition: 'opacity 0.2s, background 0.2s',
            }}>
              {/* Color accent top stripe */}
              <div style={{ width: '100%', height: 3, background: color, boxShadow: `0 0 6px ${color}80`, flexShrink: 0 }} />

              {/* Channel number + name */}
              <div style={{ padding: '4px 8px 2px', width: '100%' }}>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#555', textAlign: 'center' }}>CH{i+1}</div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 600, color: color, textAlign: 'center', marginTop: 1, opacity: 0.8 }}>{CHANNEL_NAMES[i]}</div>
              </div>

              {/* EQ knobs */}
              <div className="flex flex-col items-center gap-[3px]" style={{ borderBottom: '1px solid #1a1a1a', width: '100%', padding: '4px 0 6px' }}>
                <Knob size={22} color="#B7FF00" initialValue={0.5} label="HI" />
                <Knob size={22} color="#FF8C00" initialValue={0.5} label="MID" />
                <Knob size={22} color="#00BFFF" initialValue={0.5} label="LO" />
              </div>

              {/* AUX sends */}
              <div className="flex gap-1 justify-center py-[5px]" style={{ borderBottom: '1px solid #1a1a1a', width: '100%' }}>
                <Knob size={18} color="#666" initialValue={0} label="A1" />
                <Knob size={18} color="#666" initialValue={0} label="A2" />
              </div>

              {/* PAN */}
              <div className="flex justify-center py-[5px]" style={{ borderBottom: '1px solid #1a1a1a', width: '100%' }}>
                <Knob size={24} color={color} initialValue={0.5} label="PAN" />
              </div>

              {/* M / S buttons */}
              <div className="flex w-full" style={{ height: 22, borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
                <button
                  onClick={() => toggleMute(i)}
                  style={{
                    flex: 1, fontSize: 9, fontFamily: "'Share Tech Mono',monospace",
                    background: muted ? 'rgba(255,140,0,0.22)' : 'transparent',
                    color: muted ? '#FF8C00' : '#444',
                    border: muted ? '1px solid rgba(255,140,0,0.5)' : 'none',
                    borderRight: '1px solid #1a1a1a',
                    cursor: 'pointer',
                    boxShadow: muted ? 'inset 0 0 8px rgba(255,140,0,0.15), 0 0 6px rgba(255,140,0,0.3)' : 'none',
                    textShadow: muted ? '0 0 8px #FF8C00' : 'none',
                    transition: 'all 0.15s',
                  }}
                >M</button>
                <button
                  onClick={() => setSoloChannel(soloChannel === i ? null : i)}
                  style={{
                    flex: 1, fontSize: 9, fontFamily: "'Share Tech Mono',monospace",
                    background: soloed ? 'rgba(255,215,0,0.22)' : 'transparent',
                    color: soloed ? '#FFD700' : '#444',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: soloed ? 'inset 0 0 8px rgba(255,215,0,0.15), 0 0 6px rgba(255,215,0,0.3)' : 'none',
                    textShadow: soloed ? '0 0 8px #FFD700' : 'none',
                    transition: 'all 0.15s',
                  }}
                >S</button>
              </div>

              {/* Fader — stable initial value from useMemo */}
              <div style={{ flex: 1, width: '100%', minHeight: 120 }}>
                <Fader color={muted ? '#2a2a2a' : color} initialValue={initialFaderValues[i]} />
              </div>
            </div>
          );
        })}

        {/* Master channel */}
        <div className="flex flex-col items-center shrink-0" style={{ width: 100, background: '#111', borderLeft: '2px solid #2a2a2a' }}>
          <div style={{ width: '100%', height: 3, background: '#B7FF00', boxShadow: '0 0 8px rgba(183,255,0,0.6)', flexShrink: 0 }} />
          <div style={{ padding: '4px 0 0', fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, color: '#B7FF00', letterSpacing: '0.1em', textAlign: 'center' }}>MASTER</div>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: '#555', textAlign: 'center', marginBottom: 4 }}>OUT BUS</div>
          <div className="flex gap-2 justify-center py-2" style={{ borderBottom: '1px solid #222', width: '100%' }}>
            <Knob size={28} color="#B7FF00" initialValue={0.8} label="GAIN" />
            <Knob size={28} color="#00BFFF" initialValue={0.5} label="WIDTH" />
          </div>
          <div className="flex justify-center py-2" style={{ borderBottom: '1px solid #222', width: '100%' }}>
            <Knob size={24} color="#BF5FFF" initialValue={0.3} label="SEND" />
          </div>
          {/* M/S for master — real buttons, not divs */}
          <div className="flex w-full" style={{ height: 22, borderBottom: '1px solid #222', flexShrink: 0 }}>
            <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontFamily: "'Share Tech Mono',monospace", color: '#333', background: 'transparent', border: 'none', borderRight: '1px solid #222', cursor: 'pointer' }}>M</button>
            <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontFamily: "'Share Tech Mono',monospace", color: '#333', background: 'transparent', border: 'none', cursor: 'pointer' }}>S</button>
          </div>
          <div style={{ flex: 1, width: '100%', minHeight: 120 }}>
            <Fader color="#B7FF00" initialValue={0.85} />
          </div>
        </div>
      </div>
    </div>
  );
}
