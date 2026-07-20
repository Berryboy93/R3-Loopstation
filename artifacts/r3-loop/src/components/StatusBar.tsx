import { useState } from 'react';

interface StatusBarProps {
  bpm: number;
}

const Pipe = () => (
  <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
);

export function StatusBar({ bpm }: StatusBarProps) {
  const [midiActive, setMidiActive] = useState(false);
  return (
    <div
      className="h-[26px] flex items-center justify-between px-3 shrink-0 select-none"
      style={{
        background: '#0b0b0b',
        borderTop: '1px solid rgba(183,255,0,0.2)',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 8,
      }}
    >
      {/* Left — AUDIO ONLINE */}
      <div className="flex items-center gap-2">
        <div className="w-[8px] h-[8px] rounded-full bg-[#B7FF00] animate-led-pulse" style={{ flexShrink: 0 }} />
        <span style={{ color: '#B7FF00', fontWeight: 700, letterSpacing: '0.18em', textShadow: '0 0 7px rgba(183,255,0,0.55)' }}>
          AUDIO ONLINE
        </span>
      </div>

      {/* Center — transport stats */}
      <div className="flex items-center gap-3">
        <span style={{ color: '#444', letterSpacing: '0.06em' }}>0 / 8 LOOPS LOADED</span>
        <Pipe />
        <span style={{ color: '#B7FF00', textShadow: '0 0 6px rgba(183,255,0,0.35)', letterSpacing: '0.06em' }}>{bpm} BPM</span>
        <Pipe />
        <span style={{ color: '#3a3a3a', letterSpacing: '0.06em' }}>EXT: DLY</span>
        <Pipe />
        <button
          onClick={() => setMidiActive(m => !m)}
          style={{
            border: `1px solid ${midiActive ? 'rgba(183,255,0,0.45)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 2, padding: '1px 7px', fontFamily: 'inherit', fontSize: 'inherit',
            cursor: 'pointer', letterSpacing: '0.06em', transition: 'all 0.12s',
            color: midiActive ? '#B7FF00' : '#555',
            background: midiActive ? 'rgba(183,255,0,0.08)' : 'transparent',
            boxShadow: midiActive ? '0 0 6px rgba(183,255,0,0.3)' : 'none',
            textShadow: midiActive ? '0 0 6px rgba(183,255,0,0.5)' : 'none',
          }}
        >MIDI IN</button>
        <Pipe />
        <div className="flex items-center gap-1.5">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39FF14', boxShadow: '0 0 5px rgba(57,255,20,0.8)', flexShrink: 0 }} />
          <span style={{ color: '#3a3a3a', letterSpacing: '0.06em' }}>CLK OUT</span>
        </div>
        <Pipe />
        <span style={{ color: '#00BFFF', textShadow: '0 0 5px rgba(0,191,255,0.4)', letterSpacing: '0.06em' }}>≋ STEREO</span>
        <Pipe />
        <span style={{ color: '#FF8C00', textShadow: '0 0 5px rgba(255,140,0,0.4)', letterSpacing: '0.06em' }}>8 BIT</span>
      </div>

      {/* Right — branding */}
      <div style={{ color: '#2a2a2a', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.15em', fontSize: 8, fontWeight: 600 }}>
        DESIGNED BY DJ ERNESTO
      </div>
    </div>
  );
}
