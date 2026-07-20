import { useState, useEffect } from 'react';
import { Knob } from './Knob';

export function MasterEQ() {
  const [meterValue, setMeterValue] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let time = 0;
    
    const animateMeter = () => {
      time += 0.1;
      const activity = (Math.sin(time * 0.5) * 0.5 + 0.5) * (Math.random() * 0.4 + 0.6);
      setMeterValue(activity);
      animationFrameId = requestAnimationFrame(animateMeter);
    };

    animateMeter();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="glass-panel p-3 flex flex-col select-none" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <span className="text-[10px] font-bold text-white tracking-widest mb-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>MASTER EQ</span>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Knob label="LOW" size={32} color="#FF8C00" initialValue={0.6} />
          <Knob label="MID" size={32} color="#FFD700" initialValue={0.5} />
          <Knob label="HIGH" size={32} color="#00BFFF" initialValue={0.7} />
          <Knob label="AIR" size={32} color="#B7FF00" initialValue={0.3} />
        </div>

        {/* Output EQ Meter */}
        <div className="flex gap-1 items-end h-16 ml-2">
          <div className="flex flex-col justify-end w-2 gap-[1px] h-full bg-[#0a0a0a] p-[1px] border border-[rgba(255,255,255,0.05)] rounded-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
            {Array.from({length: 12}).map((_, j) => {
              const ledVal = j / 12;
              const isActive = (1 - ledVal) <= meterValue;
              const isRed = j < 2;
              const isYellow = j >= 2 && j < 5;
              const color = isRed ? '#FF3B3B' : isYellow ? '#FF8C00' : '#39FF14';
              return (
                <div 
                  key={j} 
                  className="w-full flex-1 rounded-[1px]" 
                  style={{ 
                    backgroundColor: isActive ? color : '#222',
                    opacity: isActive ? 1 : 0.3,
                    boxShadow: isActive ? `0 0 4px ${color}60` : 'none'
                  }} 
                />
              );
            })}
          </div>
          <div className="flex flex-col justify-between h-full text-[7px] text-[#555] font-mono leading-none py-[2px]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
            <span>0</span>
            <span>-12</span>
            <span>-24</span>
            <span>-60</span>
          </div>
        </div>
      </div>
    </div>
  );
}
