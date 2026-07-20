import { useState, useRef, useEffect } from 'react';

export function SceneBank() {
  const [activeScene,  setActiveScene]  = useState('A');
  // savedScenes tracks which slots have been explicitly saved by the user
  const [savedScenes,  setSavedScenes]  = useState<Set<string>>(new Set());
  const [recallFlash,  setRecallFlash]  = useState(false);

  // Recall-flash timer — stored in a ref so it can be cleared on unmount
  // (prevents setState after unmount) and cancelled on rapid re-clicks
  // (prevents stacked timers cutting a new flash short).
  const recallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (recallTimerRef.current !== null) clearTimeout(recallTimerRef.current);
    };
  }, []);

  const handleRecall = () => {
    if (!savedScenes.has(activeScene)) return;
    setRecallFlash(true);
    if (recallTimerRef.current !== null) clearTimeout(recallTimerRef.current);
    recallTimerRef.current = setTimeout(() => {
      setRecallFlash(false);
      recallTimerRef.current = null;
    }, 500);
  };
  
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
              {/* Saved indicator dot — bottom-centre, only visible when not active */}
              {savedScenes.has(scene) && !active && (
                <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full"
                  style={{ background: '#B7FF00', opacity: 0.55 }} />
              )}
              {scene}
            </button>
          );
        })}
      </div>

      <div className="flex gap-1">
        <button
          onClick={handleRecall}
          className="flex-1 glass-panel text-[9px] py-1.5 rounded-sm transition-all"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            color: recallFlash ? '#B7FF00'
                 : savedScenes.has(activeScene) ? '#888'
                 : '#2a2a2a',
            cursor: savedScenes.has(activeScene) ? 'pointer' : 'default',
            textShadow: recallFlash ? '0 0 8px rgba(183,255,0,0.7)' : 'none',
          }}
        >RECALL</button>
        <button
          onClick={() => setSavedScenes(prev => new Set([...prev, activeScene]))}
          className="flex-1 glass-panel text-[9px] py-1.5 rounded-sm transition-colors"
          style={{ fontFamily: "'Share Tech Mono', monospace", color: savedScenes.has(activeScene) ? '#B7FF00' : '#888' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#B7FF00'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = savedScenes.has(activeScene) ? '#B7FF00' : '#888'; }}
        >SAVE</button>
      </div>
    </div>
  );
}
