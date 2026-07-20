import { useState } from 'react';

export function TabNav() {
  const [activeTab, setActiveTab] = useState('PERFORM');
  const tabs = ['PERFORM', 'MIXER', 'SEQUENCE', 'FX RACK', 'SONG'];

  return (
    <div className="h-[36px] glass-panel border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between px-2 shrink-0 select-none" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
      <div className="flex h-full">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 h-full text-xs font-bold tracking-wider transition-all relative ${
              activeTab === tab
                ? 'bg-[#B7FF00] text-black shadow-[0_-4px_10px_rgba(183,255,0,0.4)]'
                : 'text-[#888] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
            }`}
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute top-0 left-0 w-full h-[2px] bg-[#B7FF00] shadow-[0_2px_8px_rgba(183,255,0,0.8)]" />
            )}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-2 pr-2">
        <button className="text-[10px] text-[#888] hover:text-white px-2 py-1" style={{ fontFamily: "'Share Tech Mono', monospace" }}>FILE</button>
        <button className="text-[10px] text-[#888] hover:text-white px-2 py-1" style={{ fontFamily: "'Share Tech Mono', monospace" }}>LOAD</button>
        <button className="text-[10px] text-[#FF3B3B] laser-red bg-[rgba(255,59,59,0.1)] px-3 py-1 rounded-sm hover:bg-[rgba(255,59,59,0.2)] transition-colors" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          SAVE
        </button>
      </div>
    </div>
  );
}
