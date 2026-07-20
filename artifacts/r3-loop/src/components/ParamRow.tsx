import { useState, useRef } from 'react';

interface ParamRowProps {
  label: string;
  valueDisplay: string;
  color?: string;
  initialValue?: number;
}

export function ParamRow({ label, valueDisplay, color = '#cccccc', initialValue = 0.5 }: ParamRowProps) {
  const [value, setValue] = useState(initialValue);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const update = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    setValue(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  const onDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    update(e);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  const onMove = (e: MouseEvent) => { if (isDragging.current) update(e); };
  const onUp = () => { isDragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };

  const displayVal = valueDisplay.replace('{v}', Math.round(value * 100).toString());

  return (
    <div className="flex items-center gap-1.5 w-full select-none" style={{ paddingTop: 2, paddingBottom: 2 }}>
      <span className="text-[9px] w-8 shrink-0 tracking-widest" style={{ color: 'rgba(150,160,180,0.6)', fontFamily: "'Share Tech Mono', monospace" }}>{label}</span>

      <div ref={trackRef} className="flex-1 h-[14px] flex items-center relative cursor-ew-resize group" onMouseDown={onDown}>
        {/* Track groove */}
        <div className="absolute inset-0 rounded-full overflow-hidden" style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)'
        }}>
          {/* Fill */}
          <div className="h-full rounded-full transition-none" style={{
            width: `${value * 100}%`,
            background: `linear-gradient(90deg, ${color}30, ${color}60)`,
          }} />
        </div>
        {/* Thumb dot */}
        <div className="absolute w-[10px] h-[10px] rounded-full z-10 transition-none" style={{
          left: `${value * 100}%`,
          transform: 'translateX(-50%)',
          background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5), ${color})`,
          boxShadow: `0 0 6px ${color}90, 0 1px 3px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.3)`,
          border: '1px solid rgba(255,255,255,0.2)',
        }} />
      </div>

      <span className="text-[9px] w-10 text-right shrink-0 tabular-nums" style={{ color: 'rgba(200,210,230,0.8)', fontFamily: "'Share Tech Mono', monospace" }}>{displayVal}</span>
    </div>
  );
}
