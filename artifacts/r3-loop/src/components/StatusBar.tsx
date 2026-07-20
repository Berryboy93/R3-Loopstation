import { useState } from 'react';

interface StatusBarProps {
  bpm: number;
  /** Reflects the last health-check result from the API server */
  apiOnline: boolean;
  /** Number of LoopSlots that currently have a loaded loop (0–4) */
  loopsLoaded: number;
}

const Pipe = () => (
  <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
);

export function StatusBar({ bpm, apiOnline, loopsLoaded }: StatusBarProps) {
  const [midiActive, setMidiActive] = useState(false);
  return (
    <div
      className="h-[26px] flex items-center justify-between px-3 shrink-0 select-none"
      style={{
        background: '#0b0b0b',
        borderTop: `1px solid ${apiOnline ? 'rgba(183,255,0,0.2)' : 'rgba(255,59,59,0.15)'}`,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 8,
        transition: 'border-top-color 0.4s',
      }}
    >
      {/* Left — AUDIO ONLINE / OFFLINE — driven by live API health check */}
      <div className="flex items-center gap-2">
        <div
          className="w-[8px] h-[8px] rounded-full"
          style={{
            flexShrink: 0,
            background: apiOnline ? '#B7FF00' : '#FF3B3B',
            boxShadow: apiOnline ? '0 0 6px rgba(183,255,0,0.8)' : '0 0 6px rgba(255,59,59,0.6)',
            animation: apiOnline ? 'led-pulse 2s ease-in-out infinite' : 'none',
            transition: 'background 0.4s, box-shadow 0.4s',
          }}
        />
        <span style={{
          color: apiOnline ? '#B7FF00' : '#FF3B3B',
          fontWeight: 700, letterSpacing: '0.18em',
          textShadow: apiOnline ? '0 0 7px rgba(183,255,0,0.55)' : '0 0 7px rgba(255,59,59,0.45)',
          transition: 'color 0.4s, text-shadow 0.4s',
        }}>
          {apiOnline ? 'AUDIO ONLINE' : 'API OFFLINE'}
        </span>
      </div>

      {/* Center — transport stats */}
      <div className="flex items-center gap-3">
        <span style={{
          color: loopsLoaded > 0 ? '#B7FF00' : '#444',
          letterSpacing: '0.06em',
          textShadow: loopsLoaded > 0 ? '0 0 5px rgba(183,255,0,0.35)' : 'none',
          transition: 'color 0.2s',
        }}>{loopsLoaded} / 4 LOOPS LOADED</span>
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
