import { useState, useRef, useId, useEffect } from 'react';

interface KnobProps {
  label?: string;
  valueDisplay?: string;
  size?: number;
  color?: string;
  initialValue?: number;
  onChange?: (val: number) => void;
  className?: string;
}

export function Knob({ label, valueDisplay, size = 44, color = '#B7FF00', initialValue = 0.5, onChange, className = '' }: KnobProps) {
  const [value, setValue] = useState(initialValue);

  // Sync internal state when parent changes initialValue (e.g. preset application)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = (startY.current - e.clientY) * 0.008;
    const newVal = Math.max(0, Math.min(1, startValue.current + delta));
    setValue(newVal);
    onChange?.(newVal);
  };
  
  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const arcR = size / 2 - 5;
  const startAngle = -225; // degrees, 7 o'clock
  const sweepTotal = 270;
  const angle = startAngle + value * sweepTotal; // current indicator angle in deg

  // Arc helpers
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPoint = (r: number, deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  // Build SVG arc path
  const arcPath = (r: number, startDeg: number, endDeg: number, large?: boolean) => {
    const s = arcPoint(r, startDeg);
    const e = arcPoint(r, endDeg);
    const la = large || Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 1 ${e.x} ${e.y}`;
  };

  const indicator = arcPoint(arcR - 3, angle);

  // Stable unique gradient ID per mounted instance (useId avoids collision when same label appears multiple times)
  const uid = useId();
  const gradId = `knob-grad-${uid.replace(/:/g, '')}`;

  return (
    <div className={`flex flex-col items-center gap-[3px] select-none ${className}`}>
      <div
        className="relative cursor-ns-resize"
        style={{ width: size, height: size, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.7))' }}
        onMouseDown={handleMouseDown}
      >
        <svg width={size} height={size}>
          <defs>
            <radialGradient id={gradId} cx="38%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#3a3f4a" />
              <stop offset="60%" stopColor="#1a1e26" />
              <stop offset="100%" stopColor="#0d1016" />
            </radialGradient>
          </defs>
          {/* Outer ring - gunmetal */}
          <circle cx={cx} cy={cy} r={outerR} fill="#141820" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          {/* Knob face */}
          <circle cx={cx} cy={cy} r={outerR - 3} fill={`url(#${gradId})`} />
          {/* Track arc (dim) */}
          <path d={arcPath(arcR, startAngle, startAngle + sweepTotal, true)} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="2" strokeLinecap="round" />
          {/* Value arc (colored) */}
          {value > 0.01 && (
            <path
              d={arcPath(arcR, startAngle, startAngle + value * sweepTotal, value > 0.5)}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          )}
          {/* Specular highlight */}
          <path d={arcPath(outerR - 4, -200, -155)} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Indicator dot */}
          <circle cx={indicator.x} cy={indicator.y} r={2.2} fill="white" style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9))' }} />
        </svg>
      </div>
      {label && <span className="text-[8px] tracking-widest uppercase" style={{ fontFamily: "'Share Tech Mono', monospace", color: 'rgba(175,182,200,0.85)', letterSpacing: '0.14em' }}>{label}</span>}
      {valueDisplay && <span className="text-[9px]" style={{ color, fontFamily: "'Share Tech Mono', monospace" }}>{valueDisplay}</span>}
    </div>
  );
}
