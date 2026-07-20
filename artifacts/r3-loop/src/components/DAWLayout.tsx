import { Header } from './Header';
import { MarqueeTicker } from './MarqueeTicker';
import { TabNav } from './TabNav';
import { GlobalFX } from './GlobalFX';
import { LoopGrid } from './LoopGrid';
import { SceneBank } from './SceneBank';
import { MasterEQ } from './MasterEQ';
import { OutputPanel } from './OutputPanel';
import { StatusBar } from './StatusBar';

export function DAWLayout() {
  return (
    <div className="w-full h-full flex flex-col text-white overflow-hidden" style={{ 
      background: 'radial-gradient(ellipse at 50% 0%, rgba(183,255,0,0.04) 0%, rgba(0,15,30,0.0) 60%), #060910'
    }}>
      <Header />
      <MarqueeTicker />
      <TabNav />
      
      <div className="flex-1 flex overflow-hidden min-h-0">
        <GlobalFX />
        
        {/* Main Loop Area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: 'rgba(5, 8, 14, 0.4)' }}>
          <LoopGrid />
        </div>
        
        {/* Right Panel */}
        <div className="w-[200px] flex flex-col glass-panel shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden laser-white" style={{ borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}>
          <SceneBank />
          <MasterEQ />
          <OutputPanel />
        </div>
      </div>
      
      <StatusBar />
    </div>
  );
}
