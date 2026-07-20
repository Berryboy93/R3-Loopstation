import { useState } from 'react';

export function Header() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [quantize, setQuantize] = useState(true);
  const [limit, setLimit] = useState(false);
  const [mono, setMono] = useState(false);

  return (
    <div className="h-[60px] glass-panel border-b border-[rgba(183,255,0,0.2)] flex items-center px-4 justify-between shrink-0 select-none" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      
      {/* Logo & Transport */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <div className="text-xl font-bold tracking-tighter text-white leading-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            R3<span className="text-[#B7FF00]">/</span>LOOP
          </div>
          <div className="text-[10px] text-[#888] italic leading-none mt-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            BY DJ ERNESTO <span className="text-[#B7FF00]">Native</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-md border border-[rgba(255,255,255,0.05)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
          <button 
            className={`w-8 h-8 rounded-sm flex items-center justify-center transition-colors ${isPlaying ? 'bg-[#B7FF00] text-black shadow-[0_0_10px_rgba(183,255,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.8)]' : 'glass-panel text-white hover:bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]'}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            ▶
          </button>
          <button 
            className={`w-8 h-8 rounded-sm flex items-center justify-center transition-colors ${!isPlaying ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'glass-panel text-white hover:bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]'}`}
            onClick={() => setIsPlaying(false)}
          >
            ■
          </button>
          <button 
            className={`w-8 h-8 rounded-sm flex items-center justify-center transition-colors ${isRecording ? 'bg-[#FF3B3B] text-white shadow-[0_0_10px_rgba(255,59,59,0.6),inset_0_1px_2px_rgba(255,255,255,0.5)]' : 'glass-panel text-[#888] hover:bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]'}`}
            onClick={() => setIsRecording(!isRecording)}
          >
            ●
          </button>
        </div>
      </div>

      {/* BPM & Timing */}
      <div className="flex items-center gap-4 border-l border-r border-[rgba(255,255,255,0.05)] px-4 h-full">
        <div className="flex items-end gap-2">
          <div className="flex flex-col items-center">
            <span className="text-[#B7FF00] text-4xl leading-none tracking-tighter" style={{ fontFamily: "'Share Tech Mono', monospace", textShadow: '0 0 10px rgba(183,255,0,0.6), 0 0 20px rgba(183,255,0,0.3)' }}>
              {bpm}
            </span>
            <span className="text-[10px] text-[#555] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>BPM</span>
          </div>
          <div className="flex flex-col gap-1 pb-1">
            <button className="glass-panel text-[#888] text-[10px] px-2 py-1 rounded-sm hover:text-white hover:border-[rgba(255,255,255,0.3)] active:bg-[rgba(255,255,255,0.1)] transition-colors" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              TAP
            </button>
            <span className="text-[8px] text-[#555] text-center" style={{ fontFamily: "'Rajdhani', sans-serif" }}>TEMPO</span>
          </div>
        </div>

        <div className="flex flex-col justify-center h-full ml-4">
          <div className="flex gap-1 mb-1">
            {[-2, -1, 1, 2].map(n => (
              <button key={n} className="glass-panel text-[#888] text-[9px] w-6 h-5 flex items-center justify-center rounded-sm hover:bg-[rgba(255,255,255,0.05)] hover:text-white" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                {n > 0 ? `+${n}` : n}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C00] shadow-[0_0_5px_rgba(255,140,0,0.8)]"></div>
              <span className="text-[9px] text-[#FF8C00]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>SWING</span>
            </div>
            
            <div className="border border-[#222] bg-[#0c0c0c] text-white px-1.5 py-0.5 rounded-sm flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px' }}>
              4/4
            </div>

            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${quantize ? 'bg-[#B7FF00] shadow-[0_0_5px_rgba(183,255,0,0.8)]' : 'bg-[#333]'}`}></div>
              <span className="text-[9px] text-[#888]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>QUANTIZE</span>
              <span className="text-[9px] text-white bg-[#222] px-1 rounded-sm" style={{ fontFamily: "'Share Tech Mono', monospace" }}>1/4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Controls & Meter */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <button className="glass-panel text-[#888] text-[10px] px-2 py-1 rounded-sm hover:text-white hover:bg-[rgba(255,255,255,0.05)]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>METEO</button>
            <button 
              className={`text-[10px] px-2 py-1 rounded-sm transition-colors ${mono ? 'bg-[#B7FF00]/10 border border-[#B7FF00] text-[#B7FF00] shadow-[0_0_8px_rgba(183,255,0,0.3)]' : 'glass-panel text-[#888] hover:text-white'}`}
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
              onClick={() => setMono(!mono)}
            >
              MONO
            </button>
            <button 
              className={`text-[10px] px-2 py-1 rounded-sm transition-colors ${limit ? 'bg-[#FF3B3B]/10 border border-[#FF3B3B] text-[#FF3B3B] shadow-[0_0_8px_rgba(255,59,59,0.3)]' : 'glass-panel text-[#888] hover:text-white'}`}
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
              onClick={() => setLimit(!limit)}
            >
              LIMITER
            </button>
            <button className="glass-panel text-[#888] text-[10px] px-2 py-1 rounded-sm hover:text-white hover:bg-[rgba(255,255,255,0.05)]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>GRAIN</button>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] text-[#555]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>L.M</span>
            <button className="text-[9px] text-[#B7FF00] glass-panel border-[#B7FF00]/30 px-2 rounded-sm" style={{ fontFamily: "'Share Tech Mono', monospace" }}>LINK</button>
          </div>
        </div>

        {/* Mini VU Meter */}
        <div className="flex gap-[2px] h-8 bg-[#0a0a0a] p-1 border border-[rgba(255,255,255,0.05)] rounded-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
          {Array.from({length: 8}).map((_, i) => (
            <div key={i} className="flex flex-col justify-end w-2 gap-[1px]">
              {Array.from({length: 10}).map((_, j) => {
                const isActive = Math.random() > (j / 10);
                const isRed = j < 2;
                const isYellow = j >= 2 && j < 5;
                const color = isRed ? '#FF3B3B' : isYellow ? '#FF8C00' : '#39FF14';
                return (
                  <div 
                    key={j} 
                    className="w-full flex-1 rounded-[1px]" 
                    style={{ backgroundColor: isActive ? color : '#222', boxShadow: isActive ? `0 0 4px ${color}60` : 'none' }} 
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3 border-l border-[rgba(255,255,255,0.05)] pl-4 h-full">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <button className="glass-panel text-white text-[10px] px-2 py-1 rounded-sm hover:bg-[rgba(255,255,255,0.05)]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>● DARK</button>
            <button className="glass-panel text-[#888] text-[10px] px-2 py-1 rounded-sm hover:bg-[rgba(255,255,255,0.05)] hover:text-white" style={{ fontFamily: "'Share Tech Mono', monospace" }}>⟳ SIKK</button>
          </div>
          <button className="bg-transparent text-[#888] text-[10px] text-right hover:text-white transition-colors" style={{ fontFamily: "'Share Tech Mono', monospace" }}>SIGN OUT</button>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-[rgba(183,255,0,0.5)] flex items-center justify-center font-bold text-[#B7FF00] shadow-[0_0_10px_rgba(183,255,0,0.3),inset_0_0_10px_rgba(183,255,0,0.2)]" style={{ background: 'radial-gradient(circle at 30% 30%, #2a333c, #11151a)', fontFamily: "'Rajdhani', sans-serif" }}>
          R3
        </div>
      </div>
    </div>
  );
}
