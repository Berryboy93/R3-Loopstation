import { useState } from 'react';

export function SceneBank() {
  const [activeScene, setActiveScene] = useState('A');
  
  const scenes = [
    'A', 'B', 'C', 'D',
    'E', 'F', 'G', 'H',
    'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P'
  ];

  return (
    <div className="glass-panel flex flex-col p-3 select-none" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: 'none', borderRight: 'none', borderLeft: 'none' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-white tracking-widest" style={{ fontFamily: "'Rajdhani', sans-serif" }}>SCENE BANK</span>
        <span className="text-[8px] text-[#555] bg-[#0a0a0a] px-1.5 py-0.5 rounded-sm" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)' }}>16 SLOTS</span>
      </div>

      <div className="grid grid-cols-4 gap-1 mb-2">
        {scenes.map(scene => (
          <button
            key={scene}
            onClick={() => setActiveScene(scene)}
            className={`h-8 rounded-sm font-bold text-xs transition-colors flex items-center justify-center ${
              activeScene === scene
                ? 'bg-[#B7FF00] text-black shadow-[0_0_8px_rgba(183,255,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.8)] border border-[#B7FF00]'
                : 'glass-panel text-[#888] hover:border-[rgba(255,255,255,0.3)] hover:text-white border-[rgba(255,255,255,0.1)]'
            }`}
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
          >
            {scene}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        <button className="flex-1 glass-panel text-[#888] text-[9px] py-1.5 rounded-sm hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          RECALL
        </button>
        <button className="flex-1 glass-panel text-[#888] text-[9px] py-1.5 rounded-sm hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          SAVE
        </button>
      </div>
    </div>
  );
}
