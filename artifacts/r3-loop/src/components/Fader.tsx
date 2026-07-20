import { useState, useRef, useEffect } from 'react';
import { useViewActive } from '../contexts/ViewActiveContext';

interface FaderProps {
  color: string;
  initialValue?: number;
  label?: string;
  className?: string;
}

export function Fader({ color, initialValue = 0.75, label, className = '' }: FaderProps) {
  const [value, setValue] = useState(initialValue);

  const isDragging   = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const timeRef      = useRef(Math.random() * 100);

  // LED meter is animated by mutating DOM styles directly (no setState) —
  // re-rendering the whole fader tree 60×/s for a decorative meter was the
  // single biggest render cost with 16+ faders mounted.
  const ledRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const ledLevels  = useRef<number[]>(Array(40).fill(0));

  // Ref so the rAF loop always reads the latest value without restarting.
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  // Pause the meter animation while the parent tab view is hidden — with all
  // views kept mounted, ~16 hidden faders would otherwise churn at 60fps.
  const viewActive = useViewActive();

  // rAF loop — paused while the view is hidden, resumes on re-activation.
  // Also depends on `color` so a runtime color change (e.g. channel mute
  // swapping to gray) repaints lit LEDs instead of keeping the stale hue.
  useEffect(() => {
    if (!viewActive) return;
    // Repaint currently-lit LEDs with the (possibly new) color.
    for (let i = 0; i < 40; i++) {
      const el = ledRefs.current[i];
      if (el && ledLevels.current[i] > 0.5) {
        const lc = ledColor(i);
        el.style.background = lc;
        el.style.boxShadow  = `0 0 4px ${lc}80`;
      }
    }
    const animate = () => {
      timeRef.current += 0.05;
      const t    = timeRef.current;
      const base = (Math.sin(t) * 0.35 + 0.65) * valueRef.current;
      const noise = () => (Math.random() - 0.5) * 0.15;
      const lvl  = Math.max(0, Math.min(1, base + noise()));
      const levels = ledLevels.current;
      for (let i = 0; i < 40; i++) {
        const ledPos = 1 - i / 40;
        const next   = ledPos <= lvl ? 1 : Math.max(0, levels[i] - 0.08);
        const wasOn  = levels[i] > 0.5;
        const isOn   = next > 0.5;
        levels[i] = next;
        if (wasOn !== isOn) {
          const el = ledRefs.current[i];
          if (el) {
            const lc = ledColor(i);
            el.style.background = isOn ? lc : 'rgba(255,255,255,0.04)';
            el.style.boxShadow  = isOn ? `0 0 4px ${lc}80` : 'none';
          }
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [viewActive, color]);

  // ─── Mouse drag + unmount cleanup ─────────────────────────────────────────
  // Store active listeners in a ref so they can be removed if the component
  // unmounts while a drag is in progress (prevents document listener leak).
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
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y    = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setValue(1 - y);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    readPosition(e);

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

  // ─── dB scale ─────────────────────────────────────────────────────────────
  const toDb = (v: number) => {
    if (v < 0.01) return '-∞';
    const db = (v - 1.0) * 30 + 6;
    return (db > 0 ? '+' : '') + db.toFixed(1);
  };

  const ledColor = (i: number) => {
    if (i < 3)  return '#FF3B3B';
    if (i < 8)  return '#FF8C00';
    if (i < 14) return '#FFD700';
    return color;
  };

  // ─── Handle position ───────────────────────────────────────────────────────
  // Handle is 22px tall; -translate-y-1/2 centres it on `top`.
  // clamp(11px, …, calc(100% - 11px)) keeps the full handle visible at both
  // extremes (fixes overflow at value=0 where top=100% clips 11px below edge).
  const handleTop = `clamp(11px, ${(1 - value) * 100}%, calc(100% - 11px))`;

  return (
    <div className={`flex flex-col items-center h-full w-full ${className}`} style={{ paddingTop: 8, paddingBottom: 16 }}>
      <div className="relative flex-1 w-full flex justify-center" style={{ minHeight: 180 }}>

        {/* Channel strip brushed-metal bg — single `background` property avoids
            the shorthand-vs-longhand conflict that causes backgroundColor to be ignored */}
        <div className="absolute inset-0 rounded-sm" style={{
          background: `rgba(8,10,15,0.9) repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)`,
        }} />

        {/* Scale labels */}
        <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between py-2 z-10">
          {['+6','0','-6','-12','-18','−∞'].map(s => (
            <span key={s} className="text-[7px] leading-none" style={{ color: 'rgba(140,150,170,0.5)', fontFamily: "'Share Tech Mono', monospace" }}>{s}</span>
          ))}
        </div>

        {/* Meter + fader area */}
        <div
          ref={containerRef}
          className="absolute inset-x-0 inset-y-0 flex justify-center items-stretch cursor-ns-resize focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(183,255,0,0.5)]"
          onMouseDown={handleMouseDown}
          role="slider"
          tabIndex={0}
          aria-label={label ? `${label} fader` : 'Channel fader'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(value * 100)}
          aria-valuetext={`${toDb(value)} dB`}
          onKeyDown={e => {
            const step = e.shiftKey ? 0.1 : 0.02;
            let next: number | null = null;
            if (e.key === 'ArrowUp')        next = Math.min(1, value + step);
            else if (e.key === 'ArrowDown') next = Math.max(0, value - step);
            else if (e.key === 'PageUp')    next = Math.min(1, value + 0.1);
            else if (e.key === 'PageDown')  next = Math.max(0, value - 0.1);
            else if (e.key === 'Home')      next = 0; // ARIA slider: Home = min
            else if (e.key === 'End')       next = 1; // ARIA slider: End = max
            if (next !== null) { e.preventDefault(); setValue(next); }
          }}
          style={{ paddingLeft: 20, paddingRight: 12, paddingTop: 6, paddingBottom: 6 }}
        >
          {/* LED meter column — rendered once; the rAF loop mutates each
              LED's style directly via ledRefs (no React re-render per frame) */}
          <div className="flex flex-col gap-[1.5px] w-5 h-full justify-end" aria-hidden="true">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                ref={el => { ledRefs.current[i] = el; }}
                className="w-full rounded-[1px] flex-1"
                style={{
                  background:  'rgba(255,255,255,0.04)',
                  transition: 'background 40ms, box-shadow 40ms',
                }}
              />
            ))}
          </div>

          {/* Fader slot + handle */}
          <div className="relative flex items-stretch" style={{ width: 40, marginLeft: 4 }}>
            {/* Slot groove */}
            <div className="absolute left-1/2 -translate-x-1/2 inset-y-3 w-[3px] rounded-full" style={{
              background:  'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(30,35,50,0.6) 100%)',
              boxShadow:   'inset 0 1px 3px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)',
            }} />

            {/* Fader handle — clamped so the full 22px cap stays inside the
                container at both value=0 (bottom) and value=1 (top). */}
            <div
              className="absolute w-10 h-[22px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] flex items-center justify-center z-20"
              style={{
                left: '50%',
                top:  handleTop,
                background: `linear-gradient(180deg,
                  rgba(200,210,230,0.15) 0%,
                  rgba(255,255,255,0.06) 30%,
                  rgba(0,0,0,0.2) 70%,
                  rgba(0,0,0,0.4) 100%
                )`,
                border:    `1px solid ${color}`,
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
                  <div key={i} className="w-6 h-[1px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
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
      {label && (
        <div className="mt-1 text-[9px]" style={{ color: 'rgba(140,150,170,0.5)', fontFamily: "'Share Tech Mono', monospace" }}>
          {label}
        </div>
      )}
    </div>
  );
}
