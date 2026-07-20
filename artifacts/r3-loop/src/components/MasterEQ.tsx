import { useState, useEffect, useRef } from 'react';
import { Knob } from './Knob';

export function MasterEQ() {
  const [lMeter, setLMeter] = useState(0);
  const [rMeter, setRMeter] = useState(0);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(Math.random() * 100);

  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.07;
      const t = timeRef.current;
      const base = Math.sin(t * 0.6) * 0.4 + 0.55;
      setLMeter(Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.18)));
      setRMeter(Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.18)));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const renderMeter = (value: number) => (
    <div style={{
      width: 8, height: '100%',
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 2,
      display: 'flex', flexDirection: 'column', gap: 1, padding: 1,
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
    }}>
      {Array.from({ length: 14 }).map((_, j) => {
        const ledPos = 1 - j / 14;
        const active = ledPos <= value;
        const color = j < 2 ? '#FF3B3B' : j < 4 ? '#FF8C00' : '#39FF14';
        return (
          <div key={j} style={{
            flex: 1, borderRadius: 1,
            background: active ? color : 'rgba(255,255,255,0.04)',
            boxShadow: active ? `0 0 3px ${color}70` : 'none',
            transition: 'background 30ms',
          }} />
        );
      })}
    </div>
  );

  return (
    <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #1a1a1a', background: '#0f0f0f' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.12em' }}>MASTER EQ</span>
        {/* L/R stereo meters */}
        <div style={{ display: 'flex', gap: 2, height: 40 }}>
          {renderMeter(lMeter)}
          {renderMeter(rMeter)}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingLeft: 3 }}>
            {['+6','0','-12','-∞'].map(l => (
              <span key={l} style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 6, color: '#333', lineHeight: 1 }}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
        <Knob label="LOW"  size={30} color="#FF8C00" initialValue={0.6} />
        <Knob label="MID"  size={30} color="#FFD700" initialValue={0.5} />
        <Knob label="HIGH" size={30} color="#00BFFF" initialValue={0.7} />
        <Knob label="AIR"  size={30} color="#B7FF00" initialValue={0.35} />
      </div>
    </div>
  );
}
