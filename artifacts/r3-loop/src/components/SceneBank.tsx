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

      <div className="grid grid-cols-4 gap-[5px] mb-2">
        {scenes.map(scene => {
          const active = activeScene === scene;
          return (
            <button
              key={scene}
              onClick={() => setActiveScene(scene)}
              className="h-[34px] rounded-sm transition-all flex items-center justify-center relative overflow-hidden"
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 9, fontWeight: 700,
                background: active ? 'rgba(183,255,0,0.1)' : 'rgba(255,255,255,0.02)',
                color: active ? '#B7FF00' : '#555',
                border: `1px solid ${active ? 'rgba(183,255,0,0.45)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: active ? '0 0 10px rgba(183,255,0,0.25), inset 0 0 8px rgba(183,255,0,0.05)' : 'none',
                textShadow: active ? '0 0 8px rgba(183,255,0,0.7)' : 'none',
              }}
            >
              {/* Top accent line on active */}
              {active && (
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: '#B7FF00', boxShadow: '0 1px 6px rgba(183,255,0,0.7)' }}
                />
              )}
              {scene}
            </button>
          );
        })}
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
