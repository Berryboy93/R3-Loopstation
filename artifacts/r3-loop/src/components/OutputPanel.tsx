import { useState, useEffect, useRef } from 'react';
import { Knob } from './Knob';

export function OutputPanel() {
  const [limit, setLimit] = useState(false);
  const [mono,  setMono]  = useState(false);
  const [gain,  setGain]  = useState(0.8);
  const [width, setWidth] = useState(0.5);

  // Meters animate by mutating LED DOM styles directly — no setState per frame.
  const ledRefs = useRef<(HTMLDivElement | null)[][]>([[], []]);
  const ledOn   = useRef<boolean[][]>([Array(20).fill(false), Array(20).fill(false)]);

  useEffect(() => {
    let animationFrameId: number;
    let time = 0;

    const paint = (strip: number, value: number) => {
      for (let j = 0; j < 20; j++) {
        const isOn = (1 - j / 20) <= value;
        if (isOn === ledOn.current[strip][j]) continue;
        ledOn.current[strip][j] = isOn;
        const el = ledRefs.current[strip][j];
        if (!el) continue;
        const color = j < 3 ? '#FF3B3B' : j < 8 ? '#FF8C00' : '#39FF14';
        el.style.backgroundColor = isOn ? color : '#111';
        el.style.boxShadow       = isOn ? `0 0 3px ${color}80` : 'none';
      }
    };

    const animateMeter = () => {
      time += 0.1;
      const baseActivity = (Math.sin(time * 0.8) * 0.5 + 0.5) * 0.8;
      paint(0, baseActivity + Math.random() * 0.2);
      paint(1, baseActivity + Math.random() * 0.2);
      animationFrameId = requestAnimationFrame(animateMeter);
    };

    animateMeter();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const renderMeterStrip = (strip: number) => {
    return (
      <div aria-hidden="true" className="flex flex-col justify-end w-3 gap-[1px] h-full bg-[#0a0a0a] p-[1px] border border-[rgba(255,255,255,0.05)] rounded-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
        {Array.from({length: 20}).map((_, j) => (
          <div
            key={j}
            ref={el => { ledRefs.current[strip][j] = el; }}
            className="w-full flex-1 rounded-[1px] transition-colors duration-75"
            style={{ backgroundColor: '#111' }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="glass-panel p-3 flex-1 flex flex-col select-none" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
      <span className="panel-header-title mb-3">OUTPUT</span>
      
      <div className="flex items-start justify-between flex-1">
        <div className="flex flex-col gap-4">
          <Knob label="GAIN"  size={40} color="#B7FF00" initialValue={gain}  onChange={setGain}  />
          <Knob label="WIDTH" size={36} color="#00BFFF" initialValue={width} onChange={setWidth} />
        </div>

        {/* Output Meters L/R */}
        <div className="flex gap-[2px] h-full" style={{ minHeight: '120px' }}>
          {renderMeterStrip(0)}
          {renderMeterStrip(1)}
          <div className="flex flex-col justify-between h-full text-[7px] text-[#555] font-mono leading-none pl-1 py-[2px]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
            <span>+6</span>
            <span>0</span>
            <span>-6</span>
            <span>-12</span>
            <span>-24</span>
            <span>-60</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button 
          className={`flex-1 text-[10px] py-1.5 rounded-sm transition-colors ${mono ? 'laser-green text-[#B7FF00] bg-[rgba(183,255,0,0.1)]' : 'glass-panel text-[#888] hover:text-white'}`}
          style={{ fontFamily: "'Share Tech Mono', monospace" }}
          onClick={() => setMono(!mono)}
        >
          MONO
        </button>
        <button 
          className={`flex-1 text-[10px] py-1.5 rounded-sm transition-colors ${limit ? 'laser-red text-[#FF3B3B] bg-[rgba(255,59,59,0.1)]' : 'glass-panel text-[#888] hover:text-white'}`}
          style={{ fontFamily: "'Share Tech Mono', monospace" }}
          onClick={() => setLimit(!limit)}
        >
          LIMIT
        </button>
      </div>
    </div>
  );
}
