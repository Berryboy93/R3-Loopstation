import { useState } from 'react';
import { Knob } from './Knob';
import { Fader } from './Fader';

const CHANNEL_COLORS = ['#39FF14','#00BFFF','#FF8C00','#BF5FFF','#39FF14','#00BFFF','#FF8C00','#BF5FFF'];

export function MixerView() {
  const [soloChannel, setSoloChannel] = useState<number|null>(null);
  const [mutedChannels, setMutedChannels] = useState<Set<number>>(new Set());
  const toggleMute = (i: number) => setMutedChannels(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none" style={{ background: '#0a0a0a' }}>
      {/* Header strip */}
      <div className="h-8 flex items-center justify-between px-4 shrink-0" style={{ background: '#111', borderBottom: '1px solid #222' }}>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.12em' }}>MIXER</span>
        <div className="flex items-center gap-4">
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#555' }}>8 CHANNELS</span>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39FF14', boxShadow: '0 0 6px #39FF1480' }} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#39FF14' }}>STEREO OUT</span>
          </div>
        </div>
      </div>

      {/* Channel strips */}
      <div className="flex-1 flex overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => {
          const color = CHANNEL_COLORS[i];
          const muted = mutedChannels.has(i);
          const soloed = soloChannel === i;
          return (
            <div key={i} className="flex flex-col items-center" style={{
              width: 80, minWidth: 80, borderRight: '1px solid #1a1a1a',
              background: muted ? 'rgba(0,0,0,0.6)' : '#0c0c0c',
              opacity: soloChannel !== null && !soloed ? 0.4 : 1,
              transition: 'opacity 0.2s, background 0.2s',
            }}>
              {/* Color accent top stripe */}
              <div style={{ width: '100%', height: 3, background: color, boxShadow: `0 0 6px ${color}80`, flexShrink: 0 }} />
              
              {/* Channel label */}
              <div style={{ padding: '4px 8px 2px', width: '100%' }}>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#555', textAlign: 'center' }}>CH{i+1}</div>
              </div>

              {/* EQ knobs */}
              <div className="flex flex-col items-center gap-1 py-1" style={{ borderBottom: '1px solid #1a1a1a', width: '100%', padding: '4px 0 6px' }}>
                <Knob size={22} color="#B7FF00" initialValue={0.5} label="HI" />
                <Knob size={22} color="#FF8C00" initialValue={0.5} label="MID" />
                <Knob size={22} color="#00BFFF" initialValue={0.5} label="LO" />
              </div>

              {/* AUX */}
              <div className="flex gap-1 py-2" style={{ borderBottom: '1px solid #1a1a1a' }}>
                <Knob size={18} color="#888" initialValue={0} label="A1" />
                <Knob size={18} color="#888" initialValue={0} label="A2" />
              </div>

              {/* PAN */}
              <div className="py-2" style={{ borderBottom: '1px solid #1a1a1a' }}>
                <Knob size={24} color={color} initialValue={0.5} label="PAN" />
              </div>

              {/* M / S buttons */}
              <div className="flex w-full" style={{ height: 24, borderBottom: '1px solid #1a1a1a' }}>
                <button
                  onClick={() => toggleMute(i)}
                  style={{
                    flex: 1, fontSize: 9, fontFamily: "'Share Tech Mono',monospace",
                    background: muted ? 'rgba(255,140,0,0.2)' : 'transparent',
                    color: muted ? '#FF8C00' : '#555',
                    border: 'none', borderRight: '1px solid #1a1a1a',
                    cursor: 'pointer',
                    textShadow: muted ? '0 0 8px #FF8C00' : 'none',
                  }}
                >M</button>
                <button
                  onClick={() => setSoloChannel(soloChannel === i ? null : i)}
                  style={{
                    flex: 1, fontSize: 9, fontFamily: "'Share Tech Mono',monospace",
                    background: soloed ? 'rgba(255,215,0,0.2)' : 'transparent',
                    color: soloed ? '#FFD700' : '#555',
                    border: 'none',
                    cursor: 'pointer',
                    textShadow: soloed ? '0 0 8px #FFD700' : 'none',
                  }}
                >S</button>
              </div>

              {/* Fader */}
              <div style={{ flex: 1, width: '100%', minHeight: 120 }}>
                <Fader color={muted ? '#333' : color} initialValue={0.75 + (Math.random() * 0.1 - 0.05)} />
              </div>
            </div>
          );
        })}

        {/* Master channel */}
        <div className="flex flex-col items-center" style={{ width: 100, background: '#111', borderLeft: '2px solid #333' }}>
          <div style={{ width: '100%', height: 3, background: '#B7FF00', boxShadow: '0 0 8px rgba(183,255,0,0.6)', flexShrink: 0 }} />
          <div style={{ padding: '4px 0 2px', fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, color: '#B7FF00', letterSpacing: '0.1em' }}>MASTER</div>
          <div className="flex gap-2 py-2" style={{ borderBottom: '1px solid #222' }}>
            <Knob size={26} color="#B7FF00" initialValue={0.8} label="GAIN" />
            <Knob size={26} color="#00BFFF" initialValue={0.5} label="WIDTH" />
          </div>
          <div style={{ flex: 1, width: '100%', minHeight: 120 }}>
            <Fader color="#B7FF00" initialValue={0.85} />
          </div>
        </div>
      </div>
    </div>
  );
}