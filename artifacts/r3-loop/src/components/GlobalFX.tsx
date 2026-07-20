import { useState, useRef, useEffect } from 'react';
import { Knob } from './Knob';

export function GlobalFX() {
  const [filterType, setFilterType] = useState('HPF');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollTop += e.deltaY;
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div ref={scrollRef} className="w-[160px] glass-panel laser-green flex flex-col shrink-0 overflow-y-auto overflow-x-hidden pb-4 select-none" style={{ borderTop: 'none', borderBottom: 'none', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`
        .w-\\[160px\\]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="h-8 flex items-center justify-between px-3 sticky top-0 z-10 glass-panel" style={{ border: 'none', borderBottom: '1px solid rgba(183,255,0,0.3)', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
        <span className="text-[10px] font-bold text-white tracking-widest" style={{ fontFamily: "'Rajdhani', sans-serif" }}>GLOBAL FX</span>
        <div className="w-2 h-2 rounded-full bg-[#B7FF00] shadow-[0_0_5px_rgba(183,255,0,0.5)]"></div>
      </div>

      {/* Main Filter Section */}
      <div className="p-3">
        <div className="flex justify-between mb-4">
          <Knob label="FILTER" size={56} color="#00BFFF" initialValue={0.3} />
          <Knob label="RESO" size={40} color="#00E5FF" initialValue={0.6} />
        </div>
        
        <div className="flex bg-[#0a0a0a] border border-[#222] rounded-sm overflow-hidden" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)' }}>
          {['HPF', 'BPF', 'LPF'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 text-[9px] py-1 font-bold ${
                filterType === type 
                  ? 'bg-[#00BFFF] text-black shadow-[0_0_8px_rgba(0,191,255,0.6)]' 
                  : 'text-[#888] hover:text-white hover:bg-[#222]'
              }`}
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="section-divider" />

      {/* Multi FX */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-[#aaa] font-bold" style={{ fontFamily: "'Share Tech Mono', monospace" }}>DELAY</span>
          <Knob size={24} color="#FF8C00" initialValue={0.4} />
        </div>
        
        <div className="flex justify-between mb-4">
          <Knob label="REVERB" size={32} color="#BF5FFF" initialValue={0.2} />
          <Knob label="DRIVE" size={32} color="#FF3B3B" initialValue={0.8} />
          <Knob label="CHORUS" size={32} color="#00BFFF" initialValue={0.0} />
        </div>

        <div className="flex justify-between mb-2">
          <Knob label="FLANGER" size={28} color="#FF8C00" initialValue={0.0} />
          <Knob label="PHASER" size={28} color="#FFD700" initialValue={0.0} />
          <Knob label="PITCH" size={28} color="#B7FF00" initialValue={0.5} />
        </div>
      </div>
      <div className="section-divider" />

      {/* LFO Section */}
      <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex justify-between">
          <Knob label="RATE" valueDisplay="5D" size={36} color="#B7FF00" initialValue={0.7} />
          <Knob label="TIME" valueDisplay="1/4" size={36} color="#B7FF00" initialValue={0.25} />
          <Knob label="SHAKE" valueDisplay="5D" size={36} color="#B7FF00" initialValue={0.1} />
        </div>
      </div>
      <div className="section-divider" />

      {/* Delay Detail */}
      <div className="p-3">
        <div className="text-[9px] text-[#888] font-bold mb-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>DELAY</div>
        <div className="flex justify-between">
          <Knob label="TIME" size={28} color="#FF8C00" initialValue={0.3} />
          <Knob label="MIX" size={28} color="#FF8C00" initialValue={0.5} />
          <Knob label="FEED" size={28} color="#FF8C00" initialValue={0.6} />
        </div>
      </div>
      <div className="section-divider" />

      {/* Reverb Collapsed */}
      <div className="p-3 flex items-center justify-between hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors">
        <div className="text-[9px] text-[#888] font-bold" style={{ fontFamily: "'Share Tech Mono', monospace" }}>REVERB</div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}
