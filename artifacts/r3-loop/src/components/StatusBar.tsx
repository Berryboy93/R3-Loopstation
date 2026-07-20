export function StatusBar() {
  return (
    <div className="h-[28px] glass-panel flex items-center justify-between px-3 text-[10px] font-mono shrink-0 select-none" style={{ borderTop: '1px solid rgba(183,255,0,0.3)', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
      
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#B7FF00] animate-led-pulse"></div>
        <span className="text-[#B7FF00] font-bold" style={{ fontFamily: "'Share Tech Mono', monospace" }}>AUDIO ONLINE</span>
      </div>

      <div className="flex items-center gap-6 text-[#777]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
        <span>0 / 8 LOOPS LOADED</span>
        <span className="text-[#444]">|</span>
        <span>128 SPM</span>
        <span className="text-[#444]">|</span>
        <span>EXT: DLY</span>
        <button className="glass-panel laser-white px-2 py-[2px] rounded hover:text-white transition-colors" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          MIDI IN
        </button>
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-[#39FF14] shadow-[0_0_5px_rgba(57,255,20,0.8)]"></div>
          <span>CLK OUT</span>
        </div>
        <span className="text-[#444]">|</span>
        <span className="text-[#00BFFF]" style={{ textShadow: '0 0 5px rgba(0,191,255,0.5)' }}>≋ STEREO</span>
        <span className="text-[#444]">|</span>
        <span className="text-[#FF8C00]" style={{ textShadow: '0 0 5px rgba(255,140,0,0.5)' }}>8 BIT</span>
      </div>

      <div className="text-[#555]" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em' }}>
        DESIGNED BY DJ ERNESTO
      </div>

    </div>
  );
}
