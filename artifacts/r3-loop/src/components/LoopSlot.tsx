import { useState, useRef } from 'react';
import { Fader } from './Fader';
import { ParamRow } from './ParamRow';

interface LoopSlotProps {
  num: number;
  color: string;
  glowClass: string;
}

export function LoopSlot({ num, color, glowClass }: LoopSlotProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soloed, setSoloed] = useState(false);
  const [quantized, setQuantized] = useState(false);
  const [hasLoop, setHasLoop] = useState(false);
  // Stable random initial value — computed once on mount, not on every render
  const initialFaderValue = useRef(0.7 + Math.random() * 0.1);

  return (
    <div
      className={`flex-1 h-full flex flex-col min-w-[120px] ${glowClass}`}
      style={{
        background: 'rgba(8, 11, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Slot header */}
      <div className="flex justify-between items-center px-2 shrink-0" style={{
        height: 28,
        borderBottom: `1px solid ${color}30`,
        background: `linear-gradient(90deg, ${color}08, transparent)`,
      }}>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs" style={{ color, fontFamily: "'Share Tech Mono', monospace" }}>{num}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" opacity="0.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
        </div>
        <button className="text-[11px] hover:text-white transition-colors" style={{ color: 'rgba(150,160,180,0.5)', fontFamily: "'Share Tech Mono', monospace" }}>···</button>
      </div>

      {/* Record zone */}
      <div className="px-2 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${color}20` }}>
        <button
          onClick={() => { if (isRecording) setHasLoop(true); setIsRecording(r => !r); }}
          className="w-full flex flex-col items-center justify-center gap-0.5 rounded-sm transition-all"
          style={{
            height: 80,
            border: isRecording ? `1px solid #FF3B3B` : `1px dashed ${color}25`,
            background: isRecording ? 'rgba(255,59,59,0.08)' : `${color}04`,
            boxShadow: isRecording ? '0 0 12px rgba(255,59,59,0.3), inset 0 0 20px rgba(255,59,59,0.05)' : 'none',
          }}
        >
          {isRecording ? (
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: '0 0 8px rgba(255,59,59,0.8)' }} />
          ) : (
            <span className="text-[9px] tracking-[0.15em] font-bold" style={{ color: `${color}CC`, fontFamily: "'Share Tech Mono', monospace" }}>TAP TO RECORD</span>
          )}
          <span className="text-[8px]" style={{ color: 'rgba(120,130,150,0.5)', fontFamily: "'Share Tech Mono', monospace" }}>Slot {num}</span>
        </button>
      </div>

      {/* MSQCLR buttons */}
      <div className="flex shrink-0" style={{ borderBottom: `1px solid ${color}15`, height: 26 }}>
        {[
          { key: 'M', active: muted, toggle: () => setMuted(m => !m), activeColor: '#FF8C00' },
          { key: 'S', active: soloed, toggle: () => setSoloed(s => !s), activeColor: '#FFD700' },
          { key: 'Q', active: quantized, toggle: () => setQuantized(q => !q), activeColor: color },
          { key: 'CLR', active: false, toggle: () => { setIsRecording(false); setHasLoop(false); }, activeColor: '#FF3B3B' },
        ].map(({ key, active, toggle, activeColor }, i, arr) => (
          <button
            key={key}
            onClick={toggle}
            className="flex-1 text-[9px] font-bold tracking-widest transition-all"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              color: active ? activeColor : 'rgba(130,140,160,0.6)',
              background: active ? `${activeColor}14` : 'rgba(0,0,0,0.3)',
              borderRight: i < arr.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none',
              boxShadow: active ? `inset 0 0 8px ${activeColor}30, 0 0 4px ${activeColor}40` : 'inset 0 1px 2px rgba(0,0,0,0.5)',
              textShadow: active ? `0 0 8px ${activeColor}` : 'none',
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Fader — stable initial value via useRef, not recalculated on re-render */}
      <div className="flex-1 min-h-0" style={{ minHeight: 140 }}>
        <Fader color={color} initialValue={initialFaderValue.current} />
      </div>

      {/* Param rows */}
      <div className="px-2 py-1.5 shrink-0 flex flex-col gap-[3px]" style={{
        borderTop: `1px solid ${color}15`,
        background: 'rgba(0,0,0,0.3)',
      }}>
        <ParamRow label="KEY"  valueDisplay="C"     color={color} initialValue={0.5} />
        <ParamRow label="DET"  valueDisplay="0 ct"  color={color} initialValue={0.5} />
        <ParamRow label="TUNE" valueDisplay="0"      color={color} initialValue={0.5} />
        <ParamRow label="PAN"  valueDisplay="0"      color={color} initialValue={0.5} />
        <ParamRow label="FLT"  valueDisplay="{v}%"  color={color} initialValue={1.0} />
        <ParamRow label="VOL"  valueDisplay="0.0 dB" color={color} initialValue={0.8} />
      </div>
    </div>
  );
}
