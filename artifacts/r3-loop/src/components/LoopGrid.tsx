import { useState, useEffect } from 'react';
import { LoopSlot } from './LoopSlot';

interface LoopGridProps {
  /** Called whenever the total number of loaded loop slots changes (0–4) */
  onLoopCountChange?: (count: number) => void;
}

const SLOTS = [
  { num: 1, color: '#39FF14', glowClass: 'laser-green' },
  { num: 2, color: '#00BFFF', glowClass: 'laser-cyan' },
  { num: 3, color: '#FF8C00', glowClass: 'laser-orange' },
  { num: 4, color: '#BF5FFF', glowClass: 'laser-purple' },
];

export function LoopGrid({ onLoopCountChange }: LoopGridProps) {
  const [loopStates, setLoopStates] = useState<boolean[]>([false, false, false, false]);

  // Propagate count to DAWLayout — in a useEffect so it never fires during render
  useEffect(() => {
    onLoopCountChange?.(loopStates.filter(Boolean).length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopStates]);

  const handleLoopChange = (idx: number, hasLoop: boolean) => {
    setLoopStates(prev => {
      const next = [...prev];
      next[idx] = hasLoop;
      return next;
    });
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {SLOTS.map((s, i) => (
        <LoopSlot
          key={s.num}
          {...s}
          onHasLoopChange={hasLoop => handleLoopChange(i, hasLoop)}
        />
      ))}
      {/* Ghost slot 5 — dim, non-interactive, suggests expandability */}
      <div className="shrink-0 h-full flex flex-col pointer-events-none" style={{ width: 52, borderLeft: '1px solid rgba(255,255,255,0.03)', opacity: 0.12 }}>
        <div className="flex items-center px-2" style={{ height: 28, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, fontWeight: 700, color: '#fff' }}>5</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 18, color: '#555', lineHeight: 1 }}>+</span>
        </div>
      </div>
    </div>
  );
}
