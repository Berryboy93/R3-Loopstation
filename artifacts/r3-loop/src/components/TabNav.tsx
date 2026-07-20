interface TabNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function TabNav({ activeTab, setActiveTab }: TabNavProps) {
  const tabs = ['PERFORM', 'MIXER', 'SEQUENCE', 'FX RACK', 'SONG', 'VOCAL'];

  return (
    <div
      className="h-[34px] flex items-center justify-between px-2 shrink-0 select-none"
      style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex h-full">
        {tabs.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 h-full relative transition-all"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                background: active ? 'rgba(183,255,0,0.05)' : 'transparent',
                color: active ? '#B7FF00' : '#4a4a4a',
                textShadow: active ? '0 0 10px rgba(183,255,0,0.55)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.15s, background 0.15s, text-shadow 0.15s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#4a4a4a'; }}
            >
              {tab}
              {/* Bottom-edge underline glow — hardware tab indicator */}
              {active && (
                <div
                  className="absolute bottom-0 left-0 w-full h-[2px]"
                  style={{ background: '#B7FF00', boxShadow: '0 -4px 12px rgba(183,255,0,0.8), 0 0 2px rgba(183,255,0,1)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-[2px] pr-1">
        {['FILE', 'LOAD'].map(label => (
          <button
            key={label}
            className="transition-colors"
            style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
              color: '#3a3a3a', padding: '2px 8px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              letterSpacing: '0.08em',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#666'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3a3a3a'; }}
          >{label}</button>
        ))}
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />
        <button
          style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: 8,
            color: '#FF3B3B', padding: '2px 10px',
            background: 'rgba(255,59,59,0.08)',
            border: '1px solid rgba(255,59,59,0.3)',
            borderRadius: 2, cursor: 'pointer', letterSpacing: '0.08em',
            boxShadow: '0 0 6px rgba(255,59,59,0.15)',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,59,59,0.18)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,59,59,0.08)'; }}
        >SAVE</button>
      </div>
    </div>
  );
}
