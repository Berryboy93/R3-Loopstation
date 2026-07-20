import { LoopSlot } from './LoopSlot';

const SLOTS = [
  { num: 1, color: '#39FF14', glowClass: 'laser-green' },
  { num: 2, color: '#00BFFF', glowClass: 'laser-cyan' },
  { num: 3, color: '#FF8C00', glowClass: 'laser-orange' },
  { num: 4, color: '#BF5FFF', glowClass: 'laser-purple' },
];

export function LoopGrid() {
  return (
    <div className="flex-1 flex overflow-hidden">
      {SLOTS.map(s => <LoopSlot key={s.num} {...s} />)}
      {/* Ghost slot 5 */}
      <div className="w-[60px] shrink-0 h-full flex flex-col opacity-20 pointer-events-none" style={{ borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="px-2 py-1.5" style={{ height: 28, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-xs text-white font-bold" style={{ fontFamily: "'Share Tech Mono', monospace" }}>5</span>
        </div>
      </div>
    </div>
  );
}
