import { useState, useMemo } from 'react';
import { Knob } from './Knob';
import { Fader } from './Fader';

const CHANNEL_COLORS = ['#39FF14','#00BFFF','#FF8C00','#BF5FFF','#39FF14','#00BFFF','#FF8C00','#BF5FFF'];
const CHANNEL_NAMES  = ['DRUMS','BASS','LEAD','PAD','SYNTH','FX SND','VOX','AUX'];

// Shared border color for inner section dividers
const DIV = '#1a1a1a';

interface MuteButtonProps {
  active: boolean;
  activeColor: string;
  label: string;
  onClick: () => void;
  borderRight?: boolean;
}

// M / S button — uses inset box-shadow for the active outline so there is
// no border-shorthand conflict (which causes undefined render behavior).
function MSButton({ active, activeColor, label, onClick, borderRight = false }: MuteButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9,
        fontFamily: "'Share Tech Mono',monospace",
        background: active ? `${activeColor}20` : 'transparent',
        color:      active ? activeColor : '#3a3a3a',
        border: 'none',
        borderRight: borderRight ? `1px solid ${DIV}` : 'none',
        cursor: 'pointer',
        // inset box-shadow creates the active border WITHOUT touching layout
        boxShadow: active
          ? `inset 0 0 0 1px ${activeColor}80, 0 0 5px ${activeColor}25`
          : 'none',
        textShadow: active ? `0 0 8px ${activeColor}` : 'none',
        transition: 'all 0.14s',
        letterSpacing: '0.04em',
      }}
    >{label}</button>
  );
}

// Section divider used between knob groups in each channel strip
function SectionLine() {
  return <div style={{ width: '100%', height: 1, background: DIV, flexShrink: 0 }} />;
}

export function MixerView() {
  const [soloChannel,   setSoloChannel]   = useState<number | null>(null);
  const [mutedChannels, setMutedChannels] = useState<Set<number>>(new Set());
  const [masterMuted,   setMasterMuted]   = useState(false);
  const [masterSoloed,  setMasterSoloed]  = useState(false);

  // Stable initial fader values — computed once, never on re-render
  const initialFaderValues = useMemo(
    () => Array.from({ length: 8 }, () => 0.72 + Math.random() * 0.08),
    []
  );

  const toggleMute = (i: number) => setMutedChannels(prev => {
    const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none" style={{ background: '#0a0a0a' }}>

      {/* ── Panel header ─────────────────────────────────────────────────── */}
      <div className="panel-header">
        <span className="panel-header-title">MIXER</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="panel-header-meta">8 CHANNELS + MASTER</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#39FF14', boxShadow: 'var(--glow-green-1)', flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
              color: '#39FF14', letterSpacing: '0.06em',
            }}>STEREO OUT</span>
          </div>
        </div>
      </div>

      {/* ── Channel strips ───────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden">

        {Array.from({ length: 8 }).map((_, i) => {
          const color  = CHANNEL_COLORS[i];
          const muted  = mutedChannels.has(i);
          const soloed = soloChannel === i;
          const dimmed = soloChannel !== null && !soloed;

          return (
            <div
              key={i}
              className="flex flex-col items-center shrink-0"
              style={{
                width: 92,
                borderRight: `1px solid ${DIV}`,
                background: muted
                  ? 'rgba(0,0,0,0.65)'
                  : `linear-gradient(180deg, ${color}08 0%, rgba(0,0,0,0) 60px, #0c0c0c 60px)`,
                opacity:    dimmed ? 0.3 : 1,
                transition: 'opacity 0.2s, background 0.2s',
              }}
            >
              {/* Top color stripe */}
              <div style={{
                width: '100%', height: 4, flexShrink: 0,
                background: `linear-gradient(90deg, ${color}, ${color}88)`,
                boxShadow: `0 0 8px ${color}70`,
              }} />

              {/* Channel identity */}
              <div style={{ padding: '5px 8px 3px', width: '100%', textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 7,
                  color: '#444', letterSpacing: '0.08em',
                }}>CH{i + 1}</div>
                <div style={{
                  fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700,
                  color: muted ? '#2a2a2a' : color, letterSpacing: '0.06em',
                  marginTop: 2,
                  textShadow: muted ? 'none' : `0 0 8px ${color}50`,
                  transition: 'color 0.2s',
                }}>{CHANNEL_NAMES[i]}</div>
              </div>

              <SectionLine />

              {/* EQ — knob size increased 22 → 26 */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, width: '100%', padding: '6px 0 8px',
              }}>
                <Knob size={26} color="#B7FF00" initialValue={0.5} label="HI"  />
                <Knob size={26} color="#FF8C00" initialValue={0.5} label="MID" />
                <Knob size={26} color="#00BFFF" initialValue={0.5} label="LO"  />
              </div>

              <SectionLine />

              {/* AUX sends — knob size increased 18 → 22 */}
              <div style={{
                display: 'flex', gap: 4, justifyContent: 'center',
                width: '100%', padding: '5px 0',
              }}>
                <Knob size={22} color="#555" initialValue={0} label="A1" />
                <Knob size={22} color="#555" initialValue={0} label="A2" />
              </div>

              <SectionLine />

              {/* PAN — knob size increased 24 → 28 */}
              <div style={{
                display: 'flex', justifyContent: 'center',
                width: '100%', padding: '5px 0',
              }}>
                <Knob size={28} color={color} initialValue={0.5} label="PAN" />
              </div>

              <SectionLine />

              {/* M / S — no border conflict; use MSButton component */}
              <div style={{ display: 'flex', width: '100%', height: 24, flexShrink: 0 }}>
                <MSButton
                  label="M" active={muted}  activeColor="#FF8C00"
                  onClick={() => toggleMute(i)} borderRight
                />
                <MSButton
                  label="S" active={soloed} activeColor="#FFD700"
                  onClick={() => setSoloChannel(soloChannel === i ? null : i)}
                />
              </div>

              <SectionLine />

              {/* Fader */}
              <div style={{ flex: 1, width: '100%', minHeight: 110 }}>
                <Fader color={muted ? '#1e1e1e' : color} initialValue={initialFaderValues[i]} />
              </div>
            </div>
          );
        })}

        {/* ── Master channel ───────────────────────────────────────────── */}
        <div
          className="flex flex-col items-center shrink-0"
          style={{
            width: 112,
            background: 'linear-gradient(180deg, rgba(183,255,0,0.07) 0%, rgba(0,0,0,0) 50px, #111 50px)',
            borderLeft: '2px solid #2a2a2a',
          }}
        >
          {/* Top accent — lime */}
          <div style={{
            width: '100%', height: 4, flexShrink: 0,
            background: 'linear-gradient(90deg, #B7FF00, #B7FF0060)',
            boxShadow: '0 0 10px rgba(183,255,0,0.6)',
          }} />

          {/* Identity */}
          <div style={{ padding: '5px 0 3px', textAlign: 'center', width: '100%' }}>
            <div style={{
              fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700,
              color: '#B7FF00', letterSpacing: '0.12em',
              textShadow: '0 0 10px rgba(183,255,0,0.5)',
            }}>MASTER</div>
            <div style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 7,
              color: '#3a3a3a', letterSpacing: '0.08em', marginTop: 1,
            }}>OUT BUS</div>
          </div>

          <SectionLine />

          {/* GAIN + WIDTH — size increased 28 → 34 */}
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'center',
            width: '100%', padding: '6px 0 8px',
          }}>
            <Knob size={34} color="#B7FF00" initialValue={0.8}  label="GAIN"  />
            <Knob size={34} color="#00BFFF" initialValue={0.5}  label="WIDTH" />
          </div>

          <SectionLine />

          {/* SEND — size increased 24 → 30 */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            width: '100%', padding: '5px 0',
          }}>
            <Knob size={30} color="#BF5FFF" initialValue={0.3} label="SEND" />
          </div>

          <SectionLine />

          {/* Master M / S */}
          <div style={{ display: 'flex', width: '100%', height: 24, flexShrink: 0 }}>
            <MSButton
              label="M" active={masterMuted}  activeColor="#FF8C00"
              onClick={() => setMasterMuted(m => !m)} borderRight
            />
            <MSButton
              label="S" active={masterSoloed} activeColor="#FFD700"
              onClick={() => setMasterSoloed(s => !s)}
            />
          </div>

          <SectionLine />

          {/* Master fader */}
          <div style={{ flex: 1, width: '100%', minHeight: 110 }}>
            <Fader color="#B7FF00" initialValue={0.85} />
          </div>
        </div>

      </div>
    </div>
  );
}
