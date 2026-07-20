export function MarqueeTicker() {
  const text = "R3 NATIVE / WEB AUDIO API / OFFLINE-FIRST / MIDI SUPPORT / POLYPHONY / ACCESSIBLE / MULTITRACK DAW / VST SYSTEM / ";
  // Duplicate string to ensure seamless loop
  const content = text.repeat(10);

  return (
    <div className="h-[24px] flex items-center overflow-hidden shrink-0 whitespace-nowrap relative select-none" style={{ background: 'rgba(14, 14, 14, 0.92)', borderTop: '1px solid rgba(183,255,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="animate-marquee inline-block text-[11px] font-mono tracking-widest text-[rgba(183,255,0,0.4)]" style={{ fontFamily: "'Share Tech Mono', monospace", textShadow: '0 0 5px rgba(183,255,0,0.2)' }}>
        {content}
      </div>
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[rgba(14,14,14,0.92)] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[rgba(14,14,14,0.92)] to-transparent pointer-events-none" />
    </div>
  );
}
