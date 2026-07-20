import { useState } from 'react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { Header } from './Header';
import { MarqueeTicker } from './MarqueeTicker';
import { TabNav } from './TabNav';
import { GlobalFX } from './GlobalFX';
import { LoopGrid } from './LoopGrid';
import { MixerView } from './MixerView';
import { SequenceView } from './SequenceView';
import { FxRackView } from './FxRackView';
import { SongView } from './SongView';
import { VocalView } from './VocalView';
import { SceneBank } from './SceneBank';
import { MasterEQ } from './MasterEQ';
import { OutputPanel } from './OutputPanel';
import { StatusBar } from './StatusBar';
import { ViewActiveContext } from '../contexts/ViewActiveContext';

export function DAWLayout() {
  const [activeTab, setActiveTab] = useState('PERFORM');
  // BPM lifted here so Header and StatusBar share the same source of truth
  const [bpm, setBpm] = useState(120);
  // Loaded-loop counter — updated by LoopGrid when any slot's hasLoop state changes
  const [loopsLoaded, setLoopsLoaded] = useState(0);
  // Live health check — drives the AUDIO ONLINE / OFFLINE indicator in StatusBar
  // API server is routed at /api (see artifacts/api-server config) — polling
  // any other path would hit the SPA fallback and report a false "online".
  const apiOnline = useHealthCheck('/api/healthz');

  // All views stay mounted; the inactive ones are hidden with display:none.
  // This preserves per-view state (mutes, solos, knob/fader positions,
  // patterns) across tab switches. Each view's continuous animations pause
  // while hidden via ViewActiveContext, so hidden views cost ~nothing.
  const views: Array<{ tab: string; node: React.ReactNode }> = [
    { tab: 'PERFORM',  node: <LoopGrid onLoopCountChange={setLoopsLoaded} /> },
    { tab: 'MIXER',    node: <MixerView /> },
    { tab: 'SEQUENCE', node: <SequenceView bpm={bpm} /> },
    { tab: 'FX RACK',  node: <FxRackView /> },
    { tab: 'SONG',     node: <SongView bpm={bpm} /> },
    { tab: 'VOCAL',    node: <VocalView /> },
  ];

  return (
    <div className="w-full h-full flex flex-col text-white overflow-hidden" style={{ background: '#080808' }}>
      <Header bpm={bpm} setBpm={setBpm} />
      <MarqueeTicker />
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <GlobalFX />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: '#0a0a0a' }}>
          {views.map(({ tab, node }) => {
            const active = tab === activeTab || (tab === 'PERFORM' && !views.some(v => v.tab === activeTab));
            return (
              <div key={tab} className="flex-1 flex-col min-h-0 overflow-hidden" style={{ display: active ? 'flex' : 'none' }}>
                <ViewActiveContext.Provider value={active}>
                  {node}
                </ViewActiveContext.Provider>
              </div>
            );
          })}
        </div>
        <div className="w-[200px] flex flex-col shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ background: '#0f0f0f', borderLeft: '1px solid #1e1e1e' }}>
          <SceneBank />
          <MasterEQ />
          <OutputPanel />
        </div>
      </div>

      <StatusBar bpm={bpm} apiOnline={apiOnline ?? false} loopsLoaded={loopsLoaded} />
    </div>
  );
}
