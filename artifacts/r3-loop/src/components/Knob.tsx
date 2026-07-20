import { useState, useRef, useId, useEffect } from 'react';

interface KnobProps {
  label?: string;
  valueDisplay?: string;
  size?: number;
  color?: string;
  initialValue?: number;
  /** Value to restore on double-click. Defaults to the first initialValue received. */
  defaultValue?: number;
  onChange?: (val: number) => void;
  className?: string;
}

export function Knob({
  label,
  valueDisplay,
  size = 44,
  color = '#B7FF00',
  initialValue = 0.5,
  defaultValue,
  onChange,
  className = '',
}: KnobProps) {
  // Reset target: explicit defaultValue, otherwise the first initialValue seen at mount.
  const resetTarget = useRef(defaultValue ?? initialValue);
  useEffect(() => {
    if (defaultValue !== undefined) resetTarget.current = defaultValue;
  }, [defaultValue]);

  const [value, setValue] = useState(initialValue);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  // Sync when parent changes initialValue (preset recall, etc.)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const lastDown = useRef(0);

  // ─── Mouse ────────────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    // Double-click detection: two mousedowns < 280 ms apart = reset
    const now = Date.now();
    if (now - lastDown.current < 280) {
      const rv = resetTarget.current;
      setValue(rv);
      onChange?.(rv);
      lastDown.current = 0;
      return;
    }
    lastDown.current = now;

    e.preventDefault();
    isDragging.current = true;
    setActive(true);
    startY.current = e.clientY;
    startValue.current = value;

    const onMove = (me: MouseEvent) => {
      if (!isDragging.current) return;
      // Shift = fine mode (÷6 sensitivity)
      const sens = me.shiftKey ? 0.0012 : 0.0075;
      const delta = (startY.current - me.clientY) * sens;
      const nv = Math.max(0, Math.min(1, startValue.current + delta));
      setValue(nv);
      onChange?.(nv);
    };
    const onUp = () => {
      isDragging.current = false;
      setActive(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ─── Touch ────────────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    startValue.current = value;

    const onMove = (te: TouchEvent) => {
      if (!isDragging.current || !te.touches[0]) return;
      te.preventDefault();
      const delta = (startY.current - te.touches[0].clientY) * 0.0075;
      const nv = Math.max(0, Math.min(1, startValue.current + delta));
      setValue(nv);
      onChange?.(nv);
    };
    const onEnd = () => {
      isDragging.current = false;
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  };

  // ─── Geometry ─────────────────────────────────────────────────────────────
  const cx = size / 2;
  const cy = size / 2;
  const bezelR   = size / 2 - 1;          // outer bezel ring
  const trackR   = size / 2 - 3.8;        // value arc track
  const bodyR    = size / 2 - 4.5;        // knob face circle
  const gripOuter = bodyR * 0.97;
  const gripInner = bodyR * 0.80;

  const START_DEG = -225;
  const SWEEP     = 270;
  const angleDeg  = START_DEG + value * SWEEP;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pt = (r: number, deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  const arcPath = (r: number, sDeg: number, eDeg: number, forceFlag?: boolean) => {
    const s = pt(r, sDeg);
    const e = pt(r, eDeg);
    const la = forceFlag || Math.abs(eDeg - sDeg) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 1 ${e.x} ${e.y}`;
  };

  // Indicator line: from 25% of body radius to near edge
  const indTip  = pt(bodyR - 3.5, angleDeg);
  const indBase = pt(bodyR * 0.22, angleDeg);

  // Grip marks — skip the dead zone (from arc end ~45° to arc start ~135° going clockwise bottom)
  const showGrip  = size >= 30;
  const gripCount = size >= 44 ? 22 : 16;

  const gripLines = showGrip
    ? Array.from({ length: gripCount }, (_, i) => {
        // distribute evenly starting at top (-90°)
        const markDeg = (i / gripCount) * 360 - 90;
        // normalise to [0,360)
        const norm = ((markDeg % 360) + 360) % 360;
        // dead zone: bottom gap, roughly 45°→135° in SVG coords
        if (norm > 48 && norm < 132) return null;
        const s = pt(gripInner, markDeg);
        const e = pt(gripOuter, markDeg);
        return (
          <line
            key={i}
            x1={s.x} y1={s.y}
            x2={e.x} y2={e.y}
            stroke="rgba(255,255,255,0.13)"
            strokeWidth={size >= 44 ? 1 : 0.7}
            strokeLinecap="round"
          />
        );
      })
    : null;

  // Unique gradient IDs — useId prevents collisions across multiple mounted knobs
  const uid     = useId().replace(/:/g, '');
  const gradId  = `kbody-${uid}`;
  const bezelId = `kbez-${uid}`;

  const isHot = hovered || active;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col items-center gap-[3px] select-none ${className}`}>
      <div
        className="relative cursor-ns-resize"
        style={{
          width: size,
          height: size,
          filter: active
            ? `drop-shadow(0 0 9px ${color}99) drop-shadow(0 4px 9px rgba(0,0,0,0.95))`
            : isHot
            ? `drop-shadow(0 0 6px ${color}44) drop-shadow(0 3px 7px rgba(0,0,0,0.85))`
            : `drop-shadow(0 3px 7px rgba(0,0,0,0.75))`,
          transition: 'filter 0.12s ease',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={handleTouchStart}
      >
        <svg width={size} height={size}>
          <defs>
            {/* ── Metallic knob body gradient (off-centre highlight = 3D depth) ── */}
            <radialGradient id={gradId} cx="34%" cy="27%" r="72%">
              <stop offset="0%"   stopColor="#676e7c" />
              <stop offset="18%"  stopColor="#484e5c" />
              <stop offset="45%"  stopColor="#282d3a" />
              <stop offset="72%"  stopColor="#191d28" />
              <stop offset="100%" stopColor="#0d0f16" />
            </radialGradient>
            {/* ── Bezel / outer rim gradient ── */}
            <radialGradient id={bezelId} cx="50%" cy="18%" r="88%">
              <stop offset="0%"   stopColor="#42475a" />
              <stop offset="50%"  stopColor="#1d2130" />
              <stop offset="100%" stopColor="#0b0c14" />
            </radialGradient>
          </defs>

          {/* ════════════════════════════════════
              LAYER 1 — Outer bezel / rim
          ════════════════════════════════════ */}
          <circle cx={cx} cy={cy} r={bezelR} fill={`url(#${bezelId})`} />
          {/* Bezel top-edge highlight */}
          <path
            d={arcPath(bezelR - 0.6, -222, -148)}
            fill="none"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          {/* Bezel bottom shadow */}
          <path
            d={arcPath(bezelR - 0.6, -42, 42)}
            fill="none"
            stroke="rgba(0,0,0,0.65)"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* ════════════════════════════════════
              LAYER 2 — Value track + arc
          ════════════════════════════════════ */}
          {/* Track background */}
          <path
            d={arcPath(trackR, START_DEG, START_DEG + SWEEP, true)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          {/* Coloured value arc */}
          {value > 0.005 && (
            <path
              d={arcPath(trackR, START_DEG, START_DEG + value * SWEEP, value > 0.5)}
              fill="none"
              stroke={color}
              strokeWidth={size >= 38 ? 3 : 2}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 ${active ? 7 : isHot ? 4 : 3}px ${color})`,
                transition: 'filter 0.12s ease',
              }}
            />
          )}

          {/* ════════════════════════════════════
              LAYER 3 — Knob body (metallic face)
          ════════════════════════════════════ */}
          <circle cx={cx} cy={cy} r={bodyR} fill={`url(#${gradId})`} />

          {/* Depth ring: dark inner edge of bezel channel */}
          <circle
            cx={cx} cy={cy} r={bodyR}
            fill="none"
            stroke="rgba(0,0,0,0.55)"
            strokeWidth="2.2"
          />

          {/* ════════════════════════════════════
              LAYER 4 — Grip serrations
          ════════════════════════════════════ */}
          {gripLines}

          {/* ════════════════════════════════════
              LAYER 5 — Indicator line + LED
          ════════════════════════════════════ */}
          {/* Indicator line (dim stem) */}
          <line
            x1={indBase.x} y1={indBase.y}
            x2={indTip.x}  y2={indTip.y}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={size >= 36 ? 1.5 : 1}
            strokeLinecap="round"
          />
          {/* LED dot at tip */}
          <circle
            cx={indTip.x}
            cy={indTip.y}
            r={size >= 40 ? 2.3 : size >= 28 ? 1.8 : 1.4}
            fill={active ? color : isHot ? `${color}dd` : '#ffffff'}
            style={{
              filter: active
                ? `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 10px ${color}88)`
                : isHot
                ? `drop-shadow(0 0 4px ${color}99)`
                : 'drop-shadow(0 0 3px rgba(255,255,255,0.8))',
              transition: 'filter 0.12s ease',
            }}
          />

          {/* ════════════════════════════════════
              LAYER 6 — Specular highlights
          ════════════════════════════════════ */}
          {/* Primary specular bloom (upper-left) */}
          <path
            d={arcPath(bodyR * 0.74, -205, -152)}
            fill="none"
            stroke="rgba(255,255,255,0.30)"
            strokeWidth={size >= 40 ? 2.2 : 1.5}
            strokeLinecap="round"
          />
          {/* Secondary specular (tight highlight) */}
          <path
            d={arcPath(bodyR * 0.54, -192, -166)}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          {/* Bottom shadow arc (opposite side — simulates studio light from above) */}
          <path
            d={arcPath(bodyR * 0.80, -14, 38)}
            fill="none"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Label */}
      {label && (
        <span
          className="text-[8px] tracking-widest uppercase"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            color: isHot ? 'rgba(210,218,235,0.98)' : 'rgba(175,182,200,0.82)',
            letterSpacing: '0.14em',
            transition: 'color 0.12s ease',
          }}
        >
          {label}
        </span>
      )}

      {/* Value readout */}
      {valueDisplay && (
        <span
          className="text-[9px]"
          style={{
            color: active ? color : isHot ? `${color}dd` : `${color}99`,
            fontFamily: "'Share Tech Mono', monospace",
            transition: 'color 0.12s ease',
          }}
        >
          {valueDisplay}
        </span>
      )}
    </div>
  );
}
