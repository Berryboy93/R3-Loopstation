import { useState, useRef, useEffect } from 'react';

interface FaderProps {
  color: string;
  initialValue?: number;
  label?: string;
  className?: string;
}

export function Fader({ color, initialValue = 0.75, label, className = '' }: FaderProps) {
  const [value, setValue] = useState(initialValue);
  const [meterLevels, setMeterLevels] = useState<number[]>(Array(40).fill(0));
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(Math.random() * 100);
  // Ref so the rAF loop can always read the latest value without restarting
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  // rAF loop runs once on mount — reads valueRef so it never needs to restart
  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.05;
      const t = timeRef.current;
      const base = (Math.sin(t) * 0.35 + 0.65) * valueRef.current;
      const noise = () => (Math.random() - 0.5) * 0.15;
      const lvl = Math.max(0, Math.min(1, base + noise()));
      setMeterLevels(prev => prev.map((_, i) => {
        const ledPos = 1 - i / 40;
        return ledPos <= lvl ? 1 : Math.max(0, prev[i] - 0.08);
      }));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []); // stable — value is tracked through valueRef

  const getPositionFromEvent = (e: MouseEvent | React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setValue(1 - y);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    getPositionFromEvent(e);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  const onMove = (e: MouseEvent) => { if (isDragging.current) getPositionFromEvent(e); };
  const onUp = () => { isDragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };

  const toDb = (v: number) => {
    // Maps 0→-∞, 1.0→+6 dB to match the +6 top label on the scale
    if (v < 0.01) return '-∞';
    const db = (v - 1.0) * 30 + 6;
    return (db > 0 ? '+' : '') + db.toFixed(1);
  };

  const ledColor = (i: number) => {
    if (i < 3) return '#FF3B3B';
    if (i < 8) return '#FF8C00';
    if (i < 14) return '#FFD700';
    return color;
  };

  return (
    <div className={`flex flex-col items-center h-full w-full ${className}`} style={{ paddingTop: 8, paddingBottom: 16 }}>
      <div className="relative flex-1 w-full flex justify-center" style={{ minHeight: 180 }}>
        
        {/* Channel strip brushed-metal bg */}
        <div className="absolute inset-0 rounded-sm" style={{
          background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)',
          backgroundColor: 'rgba(8,10,15,0.9)'
        }} />

        {/* Scale labels — match the linear formula: v=1→+6, v=0.8→0, v=0.6→-6 … v=0→-∞ */}
        <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between py-2 z-10">
          {['+6','0','-6','-12','-18','−∞'].map(s => (
            <span key={s} className="text-[7px] leading-none" style={{ color: 'rgba(140,150,170,0.5)', fontFamily: "'Share Tech Mono', monospace" }}>{s}</span>
          ))}
        </div>

        {/* Meter + fader area */}
        <div
          ref={containerRef}
          className="absolute inset-x-0 inset-y-0 flex justify-center items-stretch cursor-ns-resize"
          onMouseDown={handleMouseDown}
          style={{ paddingLeft: 20, paddingRight: 12, paddingTop: 6, paddingBottom: 6 }}
        >
          {/* LED meter column */}
          <div className="flex flex-col gap-[1.5px] w-5 h-full justify-end">
            {Array.from({ length: 40 }).map((_, i) => {
              const active = meterLevels[i] > 0.5;
              const lc = ledColor(i);
              return (
                <div
                  key={i}
                  className="w-full rounded-[1px] flex-1"
                  style={{
                    background: active ? lc : 'rgba(255,255,255,0.04)',
                    boxShadow: active ? `0 0 4px ${lc}80` : 'none',
                    transition: 'background 40ms, box-shadow 40ms',
                  }}
                />
              );
            })}
          </div>

          {/* Fader slot + handle */}
          <div className="relative flex items-stretch" style={{ width: 40, marginLeft: 4 }}>
            {/* Fader slot groove */}
            <div className="absolute left-1/2 -translate-x-1/2 inset-y-3 w-[3px] rounded-full" style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(30,35,50,0.6) 100%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)'
            }} />

            {/* Fader handle (chrome cap) */}
            <div
              className="absolute w-10 h-[22px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] flex items-center justify-center z-20"
              style={{
                left: '50%',
                top: `${(1 - value) * 100}%`,
                background: `linear-gradient(180deg,
                  rgba(200,210,230,0.15) 0%,
                  rgba(255,255,255,0.06) 30%,
                  rgba(0,0,0,0.2) 70%,
                  rgba(0,0,0,0.4) 100%
                )`,
                border: `1px solid ${color}`,
                boxShadow: `
                  0 0 10px ${color}60,
                  0 3px 8px rgba(0,0,0,0.7),
                  inset 0 1px 0 rgba(255,255,255,0.2),
                  inset 0 -1px 0 rgba(0,0,0,0.5)
                `,
              }}
            >
              {/* Center grip lines */}
              <div className="flex flex-col gap-[3px]">
                {[0,1,2].map(i => (
                  <div key={i} className="w-6 h-[1px] rounded-full" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)'
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* dB label */}
      <div className="mt-1 text-[10px] font-bold leading-none" style={{ color, fontFamily: "'Share Tech Mono', monospace" }}>
        {toDb(value)} dB
      </div>
      {label && <div className="mt-1 text-[9px]" style={{ color: 'rgba(140,150,170,0.5)', fontFamily: "'Share Tech Mono', monospace" }}>{label}</div>}
    </div>
  );
}
