import { useState, useEffect, useRef } from 'react';
import { Knob } from './Knob';

export function MasterEQ() {
  const [lMeter, setLMeter] = useState(0);
  const [rMeter, setRMeter] = useState(0);
  // EQ band values — wired to each knob's onChange
  const [eqLow,  setEqLow]  = useState(0.6);
  const [eqMid,  setEqMid]  = useState(0.5);
  const [eqHigh, setEqHigh] = useState(0.7);
  const [eqAir,  setEqAir]  = useState(0.35);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(Math.random() * 100);

  // Meters animate by mutating LED DOM styles directly — no setState per frame.
  const ledRefs = useRef<(HTMLDivElement | null)[][]>([[], []]);
  const ledOn   = useRef<boolean[][]>([Array(14).fill(false), Array(14).fill(false)]);

  useEffect(() => {
    const paint = (strip: number, value: number) => {
      for (let j = 0; j < 14; j++) {
        const isOn = (1 - j / 14) <= value;
        if (isOn === ledOn.current[strip][j]) continue;
        ledOn.current[strip][j] = isOn;
        const el = ledRefs.current[strip][j];
        if (!el) continue;
        const color = j < 2 ? '#FF3B3B' : j < 4 ? '#FF8C00' : '#39FF14';
        el.style.background = isOn ? color : 'rgba(255,255,255,0.04)';
        el.style.boxShadow  = isOn ? `0 0 3px ${color}70` : 'none';
      }
    };
    const animate = () => {
      timeRef.current += 0.07;
      const t = timeRef.current;
      const base = Math.sin(t * 0.6) * 0.4 + 0.55;
      paint(0, Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.18)));
      paint(1, Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.18)));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const renderMeter = (strip: number) => (
    <div aria-hidden="true" style={{
      width: 8, height: '100%',
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 2,
      display: 'flex', flexDirection: 'column', gap: 1, padding: 1,
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
    }}>
      {Array.from({ length: 14 }).map((_, j) => (
        <div key={j}
          ref={el => { ledRefs.current[strip][j] = el; }}
          style={{
            flex: 1, borderRadius: 1,
            background: 'rgba(255,255,255,0.04)',
            transition: 'background 30ms',
          }} />
      ))}
    </div>
  );

  return (
    <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #1a1a1a', background: '#0f0f0f' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="panel-header-title">MASTER EQ</span>
        {/* L/R stereo meters */}
        <div style={{ display: 'flex', gap: 2, height: 40 }}>
          {renderMeter(0)}
          {renderMeter(1)}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingLeft: 3 }}>
            {['+6','0','-12','-∞'].map(l => (
              <span key={l} style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 6, color: '#333', lineHeight: 1 }}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
        <Knob label="LOW"  size={30} color="#FF8C00" initialValue={eqLow}  onChange={setEqLow}  />
        <Knob label="MID"  size={30} color="#FFD700" initialValue={eqMid}  onChange={setEqMid}  />
        <Knob label="HIGH" size={30} color="#00BFFF" initialValue={eqHigh} onChange={setEqHigh} />
        <Knob label="AIR"  size={30} color="#B7FF00" initialValue={eqAir}  onChange={setEqAir}  />
      </div>
    </div>
  );
}
