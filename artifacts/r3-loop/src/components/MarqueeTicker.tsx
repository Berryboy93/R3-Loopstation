export function MarqueeTicker() {
  const items = ['R3 NATIVE', 'WEB AUDIO API', 'OFFLINE-FIRST', 'MIDI SUPPORT', 'POLYPHONY', 'ACCESSIBLE', 'MULTITRACK DAW', 'VST SYSTEM', '16-BIT DEPTH', 'GRAIN ENGINE', 'LIVE LOOPER', 'SCENE RECALL'];
  const text = items.map(t => `  ·  ${t}`).join('') + '  ';
  const content = text.repeat(6);

  return (
    <div
      className="h-[22px] flex items-center overflow-hidden shrink-0 whitespace-nowrap relative select-none"
      style={{
        background: '#090909',
        borderTop: '1px solid rgba(183,255,0,0.15)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="animate-marquee inline-block"
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.12em',
          color: 'rgba(183,255,0,0.5)',
          textShadow: '0 0 6px rgba(183,255,0,0.25)',
        }}
      >
        {content}
      </div>
      <div className="absolute inset-y-0 left-0 w-20 pointer-events-none" style={{ background: 'linear-gradient(90deg, #090909, transparent)' }} />
      <div className="absolute inset-y-0 right-0 w-20 pointer-events-none" style={{ background: 'linear-gradient(270deg, #090909, transparent)' }} />
    </div>
  );
}
