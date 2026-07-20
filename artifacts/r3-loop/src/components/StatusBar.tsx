interface StatusBarProps {
  bpm: number;
}

export function StatusBar({ bpm }: StatusBarProps) {
  return (
    <div
      className="h-[28px] flex items-center justify-between px-3 shrink-0 select-none"
      style={{
        background: '#0c0c0c',
        borderTop: '1px solid rgba(183,255,0,0.25)',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 9,
      }}
    >
      {/* Left — AUDIO ONLINE */}
      <div className="flex items-center gap-2">
        <div className="w-[7px] h-[7px] rounded-full bg-[#B7FF00] animate-led-pulse" />
        <span className="text-[#B7FF00] font-bold tracking-widest" style={{ textShadow: '0 0 6px rgba(183,255,0,0.5)' }}>
          AUDIO ONLINE
        </span>
      </div>

      {/* Center — transport stats */}
      <div className="flex items-center gap-3" style={{ color: '#555' }}>
        <span>0 / 8 LOOPS LOADED</span>
        <span style={{ color: '#2a2a2a' }}>|</span>
        {/* Real BPM from shared state */}
        <span style={{ color: '#888' }}>{bpm} BPM</span>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <span>EXT: DLY</span>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <button
          className="border rounded-sm px-2 py-[1px] hover:text-white transition-colors"
          style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#666', background: 'transparent', fontFamily: 'inherit', fontSize: 'inherit', cursor: 'pointer' }}
        >
          MIDI IN
        </button>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <div className="flex items-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full" style={{ background: '#39FF14', boxShadow: '0 0 5px rgba(57,255,20,0.8)' }} />
          <span>CLK OUT</span>
        </div>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <span style={{ color: '#00BFFF', textShadow: '0 0 5px rgba(0,191,255,0.4)' }}>≋ STEREO</span>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <span style={{ color: '#FF8C00', textShadow: '0 0 5px rgba(255,140,0,0.4)' }}>8 BIT</span>
      </div>

      {/* Right — branding */}
      <div style={{ color: '#333', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em', fontSize: 9 }}>
        DESIGNED BY DJ ERNESTO
      </div>
    </div>
  );
}
