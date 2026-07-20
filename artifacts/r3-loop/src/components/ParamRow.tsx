import { useState, useRef, useEffect } from 'react';

interface ParamRowProps {
  label: string;
  valueDisplay: string;
  color?: string;
  initialValue?: number;
}

export function ParamRow({ label, valueDisplay, color = '#cccccc', initialValue = 0.5 }: ParamRowProps) {
  const [value, setValue] = useState(initialValue);
  const trackRef   = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Refs that hold the currently-active document listeners so we can remove
  // them on unmount even if a drag is still in progress.
  const cleanupRef = useRef<{ move: (e: MouseEvent) => void; up: () => void } | null>(null);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        document.removeEventListener('mousemove', cleanupRef.current.move);
        document.removeEventListener('mouseup',   cleanupRef.current.up);
        cleanupRef.current = null;
      }
    };
  }, []);

  const readPosition = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    setValue(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  const onDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    readPosition(e);

    // Inline closures share the same isDragging ref and are registered/
    // deregistered as a matched pair — no stale-function risk.
    const onMove = (me: MouseEvent) => { if (isDragging.current) readPosition(me); };
    const onUp   = () => {
      isDragging.current = false;
      cleanupRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };

    cleanupRef.current = { move: onMove, up: onUp };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  };

  const displayVal = valueDisplay.replace('{v}', Math.round(value * 100).toString());

  return (
    <div className="flex items-center gap-1.5 w-full select-none" style={{ paddingTop: 2, paddingBottom: 2 }}>
      <span
        className="text-[8px] w-8 shrink-0"
        style={{ color: 'rgba(155,165,185,0.75)', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.1em' }}
      >{label}</span>

      <div
        ref={trackRef}
        className="flex-1 h-[12px] flex items-center relative cursor-ew-resize group"
        onMouseDown={onDown}
      >
        {/* Track groove */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)' }}
        >
          {/* Fill */}
          <div
            className="h-full rounded-full transition-none"
            style={{ width: `${value * 100}%`, background: `linear-gradient(90deg, ${color}30, ${color}60)` }}
          />
        </div>
        {/* Thumb dot */}
        <div
          className="absolute w-[10px] h-[10px] rounded-full z-10 transition-none"
          style={{
            left: `${value * 100}%`,
            transform: 'translateX(-50%)',
            background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5), ${color})`,
            boxShadow: `0 0 6px ${color}90, 0 1px 3px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.3)`,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        />
      </div>

      <span
        className="text-[8px] w-10 text-right shrink-0 tabular-nums"
        style={{ color: 'rgba(205,215,235,0.95)', fontFamily: "'Share Tech Mono', monospace" }}
      >{displayVal}</span>
    </div>
  );
}
