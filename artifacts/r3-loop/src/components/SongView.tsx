import { useState, useRef, useEffect, useCallback } from 'react';
import { useViewActive } from '../contexts/ViewActiveContext';
import { Mic, Music2, Piano, Guitar, Plus, ZoomIn, ZoomOut, Magnet, Square, Play, Pause, Circle } from 'lucide-react';

// ── Design tokens (aligned with Aurora theme) ─────────────────────
const C = {
  bg:      '#080808',
  surface: '#111111',
  panel:   '#161616',
  border:  '#262626',
  silver:  '#E6E6E6',
  dim:     '#7A7A7A',
  green:   '#B7FF00',
  purple:  '#BF5FFF',   // our slot-4 purple
  red:     '#FF4444',
  orange:  '#FF9500',
};

const TRACK_DEFS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  vocal:  { icon: Mic,    color: C.purple,    label: 'Mic Input' },
  drum:   { icon: Music2, color: '#FF5C5C',   label: 'Trigger'   },
  synth:  { icon: Piano,  color: C.green,     label: 'Native'    },
  guitar: { icon: Guitar, color: '#4FC3F7',   label: 'Sampled'   },
};

const BEATS_PER_BAR = 4;
const TOTAL_BARS    = 16;
const RULER_H       = 32;

interface Clip {
  id:   string;
  name: string;
  bar:  number;
  len:  number;
}

interface Track {
  id:    string;
  name:  string;
  type:  string;
  input: string;
  rec:   boolean;
  mute:  boolean;
  solo:  boolean;
  clips: Clip[];
}

const INIT_TRACKS: Track[] = [
  { id: 't1', name: 'VOCAL LEAD',  type: 'vocal',  input: 'Mic Input 1',   rec: true,  mute: false, solo: false,
    clips: [{ id: 'c1', name: 'Vocal Intro', bar: 1, len: 2 }] },
  { id: 't2', name: 'DRUM KIT',    type: 'drum',   input: 'Trigger In 2',  rec: false, mute: false, solo: false,
    clips: [{ id: 'c2', name: 'Drum Loop',   bar: 1, len: 3 }] },
  { id: 't3', name: 'SYNTH BASS',  type: 'synth',  input: 'Native',        rec: false, mute: false, solo: false,
    clips: [{ id: 'c3', name: 'Bass Line A', bar: 3, len: 2 }] },
  { id: 't4', name: 'ACID LOOP',   type: 'guitar', input: 'Sampled',       rec: false, mute: false, solo: false,
    clips: [{ id: 'c4', name: 'Acid Riff',   bar: 5, len: 2 }] },
];

// ── ToggleChip ────────────────────────────────────────────────────
interface ToggleChipProps {
  active:   boolean;
  onClick:  () => void;
  label:    string;
  on:       string;
  off:      string;
  color:    string;
  pulsing?: boolean;
}

function ToggleChip({ active, onClick, label, on, off, color, pulsing }: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? off : on}
      title={active ? off : on}
      style={{
        width: 24, height: 24,
        border: `1px solid ${active ? color : C.border}`,
        backgroundColor: active ? color : 'transparent',
        color: active ? '#080808' : C.dim,
        borderRadius: 2,
        fontSize: 10, fontWeight: 700, fontFamily: "'Share Tech Mono', monospace",
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        outline: 'none',
        animation: pulsing && active ? 'recPulse 1s ease-in-out infinite' : 'none',
        transition: 'background-color 120ms, border-color 120ms, color 120ms',
      }}
    >
      {label}
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────
interface SongViewProps {
  bpm?: number;
}

// ── Main ──────────────────────────────────────────────────────────
export function SongView({ bpm = 120 }: SongViewProps) {
  const [tracks,    setTracks]    = useState<Track[]>(INIT_TRACKS);
  const [playing,   setPlaying]   = useState(false);
  const [recording, setRecording] = useState(false);
  const [beat,      setBeat]      = useState(0);
  const [pxPerBar,  setPxPerBar]  = useState(96);
  const [snap,      setSnap]      = useState(true);

  const rafRef     = useRef<number | null>(null);
  const lastTsRef  = useRef<number | null>(null);
  const leftRef    = useRef<HTMLDivElement>(null);
  const rightRef   = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const anySolo = tracks.some(t => t.solo);
  const barW    = pxPerBar;
  const totalW  = barW * TOTAL_BARS;

  // ── Transport rAF loop ─────────────────────────────────────────
  // Also paused while the SONG tab is hidden (views stay mounted); the
  // timestamp ref resets so playback resumes without a giant dt jump.
  const viewActive = useViewActive();
  useEffect(() => {
    if (!playing || !viewActive) { lastTsRef.current = null; return; }
    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt  = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      const bps = bpm / 60;
      setBeat(b => (b + dt * bps) % (TOTAL_BARS * BEATS_PER_BAR));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, bpm, viewActive]);

  // ── Auto-scroll playhead into view ────────────────────────────
  useEffect(() => {
    if (!playing || !rightRef.current) return;
    const el    = rightRef.current;
    const headX = (beat / BEATS_PER_BAR) * barW;
    const rEdge = el.scrollLeft + el.clientWidth;
    if (headX > rEdge - 48) el.scrollLeft = headX - el.clientWidth * 0.3;
    if (headX < 8 && el.scrollLeft > barW) el.scrollLeft = 0;
  }, [beat, playing, barW]);

  // ── Scroll sync (vertical only) ───────────────────────────────
  const onLeftScroll = useCallback(() => {
    if (syncingRef.current || !rightRef.current || !leftRef.current) return;
    syncingRef.current = true;
    rightRef.current.scrollTop = leftRef.current.scrollTop;
    syncingRef.current = false;
  }, []);

  const onRightScroll = useCallback(() => {
    if (syncingRef.current || !leftRef.current || !rightRef.current) return;
    syncingRef.current = true;
    leftRef.current.scrollTop = rightRef.current.scrollTop;
    syncingRef.current = false;
  }, []);

  // ── Global keyboard shortcuts ─────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt instanceof HTMLInputElement || tgt instanceof HTMLTextAreaElement || tgt instanceof HTMLSelectElement) return;
      if (e.code === 'Space') { e.preventDefault(); setPlaying(p => !p); }
      else if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault(); setRecording(r => !r);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Track mutations ───────────────────────────────────────────
  const toggleFlag = useCallback((id: string, flag: keyof Pick<Track, 'rec' | 'mute' | 'solo'>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, [flag]: !t[flag] } : t));
  }, []);

  const addTrack = useCallback(() => {
    setTracks(prev => {
      const n = prev.length + 1;
      return [...prev, {
        id:    `t${Date.now()}`,
        name:  `TRACK ${n}`,
        type:  'synth',
        input: 'Unassigned',
        rec: false, mute: false, solo: false,
        clips: [],
      }];
    });
  }, []);

  // ── Derived values ────────────────────────────────────────────
  const playheadX  = (beat / BEATS_PER_BAR) * barW;
  const barDisplay = `${Math.floor(beat / BEATS_PER_BAR) + 1}`;
  const beatDisplay = `${Math.floor(beat % BEATS_PER_BAR) + 1}`;

  // Waveform bar count: adapts to clip pixel width
  const waveCount = (lenBars: number) => Math.max(4, Math.min(80, Math.floor((lenBars * barW - 16) / 4)));

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      backgroundColor: C.bg, color: C.silver,
      fontFamily: "'Share Tech Mono', monospace",
      userSelect: 'none', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes recPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        .r3a-focus:focus-visible { outline: 2px solid ${C.green}; outline-offset: 1px; }
        .r3a-rec-focus:focus-visible { outline: 2px solid ${C.red}; outline-offset: 1px; }
      `}</style>

      {/* ── Transport strip ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', flexShrink: 0,
        borderBottom: `1px solid ${C.border}`,
        backgroundColor: C.surface,
      }}>
        {/* Left: title */}
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: C.silver }}>
          ARRANGE<span style={{ color: C.green }}>.</span>VIEW
        </span>

        {/* Right: position + transport */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Position readout */}
          <div style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: C.dim }}>{bpm} BPM</span>
            <span style={{ color: C.border, margin: '0 4px' }}>·</span>
            <span style={{ color: C.green }}>{barDisplay}</span>
            <span style={{ color: C.dim }}>.</span>
            <span style={{ color: C.silver }}>{beatDisplay}</span>
          </div>

          {/* REC */}
          <button
            type="button"
            onClick={() => setRecording(r => !r)}
            aria-pressed={recording}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
            className="r3a-rec-focus"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 2, cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
              border: `1px solid ${recording ? C.red : C.border}`,
              color: recording ? C.red : C.dim,
              backgroundColor: recording ? 'rgba(255,68,68,0.1)' : 'transparent',
              boxShadow: recording ? '0 0 10px rgba(255,68,68,0.35)' : 'none',
              transition: 'all 120ms',
            }}
          >
            <Circle size={8} fill={recording ? C.red : 'none'} color={recording ? C.red : C.dim}
              style={{ animation: recording ? 'recPulse 1s ease-in-out infinite' : 'none' }} />
            REC
          </button>

          {/* PLAY / PAUSE */}
          <button
            type="button"
            onClick={() => setPlaying(p => !p)}
            aria-pressed={playing}
            aria-label={playing ? 'Pause' : 'Play'}
            className="r3a-focus"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 2, cursor: 'pointer',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
              border: `1px solid ${C.green}`,
              color: playing ? '#080808' : C.green,
              backgroundColor: playing ? C.green : 'transparent',
              boxShadow: playing ? `0 0 14px ${C.green}66` : 'none',
              transition: 'all 120ms',
            }}
          >
            {playing
              ? <><Pause size={10} />&nbsp;PAUSE</>
              : <><Play  size={10} />&nbsp;PLAY</>
            }
          </button>

          {/* STOP */}
          <button
            type="button"
            onClick={() => { setPlaying(false); setBeat(0); }}
            aria-label="Stop and return to start"
            className="r3a-focus"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 2, cursor: 'pointer',
              border: `1px solid ${C.border}`,
              backgroundColor: 'transparent', color: C.dim,
              transition: 'border-color 120ms, color 120ms',
            }}
          >
            <Square size={11} />
          </button>
        </div>
      </div>

      {/* ── Zoom / snap toolbar ─────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 8, padding: '5px 12px', flexShrink: 0,
        borderBottom: `1px solid ${C.border}`,
        backgroundColor: C.panel,
      }}>
        <button
          type="button"
          onClick={() => setSnap(s => !s)}
          aria-pressed={snap}
          aria-label="Toggle snap to grid"
          className="r3a-focus"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 2, cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
            border: `1px solid ${snap ? C.green : C.border}`,
            color: snap ? C.green : C.dim,
            backgroundColor: 'transparent',
            transition: 'all 120ms',
          }}
        >
          <Magnet size={10} /> SNAP
        </button>

        <button type="button" aria-label="Zoom out"
          onClick={() => setPxPerBar(w => Math.max(48, w - 16))}
          className="r3a-focus"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dim, padding: 4 }}
        >
          <ZoomOut size={13} />
        </button>

        <div style={{ fontSize: 9, color: C.dim, minWidth: 32, textAlign: 'center', letterSpacing: '0.1em' }}>
          {Math.round(pxPerBar / 96 * 100)}%
        </div>

        <button type="button" aria-label="Zoom in"
          onClick={() => setPxPerBar(w => Math.min(240, w + 16))}
          className="r3a-focus"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dim, padding: 4 }}
        >
          <ZoomIn size={13} />
        </button>
      </div>

      {/* ── Ruler row ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: `1px solid ${C.border}`, backgroundColor: C.panel }}>
        {/* Corner cell — same width as track panel */}
        <div style={{ width: 224, flexShrink: 0, borderRight: `1px solid ${C.border}`, height: RULER_H }} />
        {/* Ruler scrolls in X with the timeline */}
        <div style={{ flex: 1, overflowX: 'hidden', position: 'relative' }} id="r3a-rulerScroll">
          <div style={{ width: totalW, height: RULER_H, display: 'flex', position: 'relative' }}>
            {Array.from({ length: TOTAL_BARS }).map((_, i) => (
              <div key={i} style={{
                width: barW, flexShrink: 0, height: '100%',
                borderLeft: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'flex-end', paddingBottom: 5, paddingLeft: 5,
                fontSize: 9,
                color: (i % 4 === 0) ? C.silver : C.dim,
                fontWeight: (i % 4 === 0) ? 700 : 400,
                letterSpacing: '0.1em',
              }}>
                {i + 1}
              </div>
            ))}
            {/* Playhead triangle on ruler */}
            <div style={{
              position: 'absolute', left: playheadX - 5, top: 0,
              width: 0, height: 0,
              borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
              borderTop: `8px solid ${C.green}`,
              pointerEvents: 'none', zIndex: 5,
              filter: `drop-shadow(0 0 4px ${C.green})`,
            }} />
          </div>
        </div>
      </div>

      {/* ── Track list + Timeline ───────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left panel — vertical scroll only */}
        <div
          ref={leftRef}
          onScroll={onLeftScroll}
          style={{
            width: 224, flexShrink: 0,
            borderRight: `1px solid ${C.border}`,
            backgroundColor: C.surface,
            overflowY: 'scroll', overflowX: 'hidden',
          }}
        >
          {tracks.map(t => {
            const meta = TRACK_DEFS[t.type] ?? TRACK_DEFS.synth;
            const Icon = meta.icon;
            const dimmed = anySolo && !t.solo;
            const armedAndRec = t.rec && recording && playing;
            return (
              <div
                key={t.id}
                style={{
                  height: 64, flexShrink: 0,
                  borderBottom: `1px solid ${C.border}`,
                  padding: '8px 14px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  opacity: dimmed ? 0.35 : 1,
                  backgroundColor: armedAndRec ? 'rgba(255,68,68,0.04)' : 'transparent',
                  transition: 'opacity 120ms, background-color 200ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Icon size={12} color={meta.color} aria-hidden="true" />
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: armedAndRec ? C.red : C.silver,
                  }}>
                    {t.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 9, color: C.dim, letterSpacing: '0.08em' }}>{t.input}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <ToggleChip active={t.rec}  onClick={() => toggleFlag(t.id, 'rec')}
                      label="R" color={C.red}
                      on={`Arm ${t.name}`} off={`Disarm ${t.name}`}
                      pulsing={recording && playing} />
                    <ToggleChip active={t.mute} onClick={() => toggleFlag(t.id, 'mute')}
                      label="M" color={C.orange}
                      on={`Mute ${t.name}`} off={`Unmute ${t.name}`} />
                    <ToggleChip active={t.solo} onClick={() => toggleFlag(t.id, 'solo')}
                      label="S" color={C.green}
                      on={`Solo ${t.name}`} off={`Unsolo ${t.name}`} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add track */}
          <button
            type="button"
            onClick={addTrack}
            className="r3a-focus"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', border: 'none', borderBottom: `1px solid ${C.border}`,
              background: 'none', cursor: 'pointer', color: C.dim,
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9, letterSpacing: '0.15em', transition: 'color 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = C.green)}
            onMouseLeave={e => (e.currentTarget.style.color = C.dim)}
          >
            <Plus size={11} aria-hidden="true" /> ADD TRACK
          </button>
        </div>

        {/* Timeline — both axes; X scroll mirrored to ruler */}
        <div
          ref={rightRef}
          onScroll={e => {
            onRightScroll();
            const ruler = document.getElementById('r3a-rulerScroll');
            if (ruler) ruler.scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft;
          }}
          style={{ flex: 1, overflowX: 'auto', overflowY: 'scroll', position: 'relative' }}
        >
          <div style={{ width: totalW, position: 'relative' }}>

            {/* Playhead line */}
            <div style={{
              position: 'absolute', left: playheadX, top: 0, bottom: 0, width: 1,
              backgroundColor: C.green,
              boxShadow: `0 0 8px ${C.green}`,
              pointerEvents: 'none', zIndex: 10,
            }} />

            {/* Track lanes */}
            {tracks.map(t => {
              const meta   = TRACK_DEFS[t.type] ?? TRACK_DEFS.synth;
              const dimmed = (anySolo && !t.solo) || t.mute;
              return (
                <div key={t.id} style={{
                  position: 'relative', height: 64, flexShrink: 0,
                  borderBottom: `1px solid ${C.border}`,
                  backgroundColor: C.surface,
                  opacity: dimmed ? 0.3 : 1,
                  transition: 'opacity 120ms',
                }}>
                  {/* Bar grid lines */}
                  {Array.from({ length: TOTAL_BARS }).map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute', top: 0, bottom: 0, left: i * barW, width: 1,
                      backgroundColor: (i % 4 === 0) ? '#2A2A2A' : '#1C1C1C',
                    }} />
                  ))}

                  {/* Clips */}
                  {t.clips.map(c => {
                    const clipW = c.len * barW - 4;
                    const bars  = waveCount(c.len);
                    return (
                      <div key={c.id} style={{
                        position: 'absolute',
                        left: (c.bar - 1) * barW + 2,
                        top: 6, bottom: 6, width: clipW,
                        border: `1px solid ${meta.color}`,
                        backgroundColor: `${meta.color}1A`,
                        borderRadius: 2,
                        display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '4px 6px',
                        overflow: 'hidden',
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                          color: meta.color, whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {c.name}
                        </span>
                        {/* Deterministic waveform — no Math.random() */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16, overflow: 'hidden' }} aria-hidden="true">
                          {Array.from({ length: bars }).map((_, wi) => (
                            <div key={wi} style={{
                              width: 2, flexShrink: 0,
                              height: `${18 + Math.abs(Math.sin(wi * 1.7 + c.id.charCodeAt(1))) * 82}%`,
                              backgroundColor: meta.color,
                              opacity: 0.55,
                              borderRadius: 1,
                            }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Bottom padding */}
            <div style={{ height: 120 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
