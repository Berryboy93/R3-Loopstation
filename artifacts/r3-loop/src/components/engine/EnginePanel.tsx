import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { TransportBar } from './TransportBar';
import { TrackLane } from './TrackLane';
import { WaveformVisualizer } from './WaveformVisualizer';

export function EnginePanel() {
  const engine = useAudioEngine();
  const [isInputActive, setIsInputActive] = useState(false);
  const [recordingTrackId, setRecordingTrackId] = useState<string | null>(null);

  const handleStartInput = useCallback(async () => {
    await engine.startInput();
    setIsInputActive(true);
  }, [engine]);

  const handleStopInput = useCallback(() => {
    engine.stopInput();
    setIsInputActive(false);
  }, [engine]);

  const handleRecord = useCallback(
    (trackId?: string) => {
      if (recordingTrackId === trackId) {
        engine.toggleRecord(trackId);
        setRecordingTrackId(null);
      } else {
        setRecordingTrackId(trackId || 'default');
        engine.toggleRecord(trackId);
      }
    },
    [engine, recordingTrackId]
  );

  const handleAddTrack = useCallback(() => {
    const id = `track-${Date.now()}`;
    engine.addTrack({
      id,
      name: `Track ${engine.tracks.length + 1}`,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      muted: false,
      solo: false,
      volume: 1.0,
      pan: 0,
    });
  }, [engine]);

  const handleMute = useCallback(
    (id: string) => {
      const track = engine.tracks.find((t) => t.id === id);
      if (track) engine.updateTrack(id, { muted: !track.muted });
    },
    [engine]
  );

  const handleSolo = useCallback(
    (id: string) => {
      const track = engine.tracks.find((t) => t.id === id);
      if (track) engine.updateTrack(id, { solo: !track.solo });
    },
    [engine]
  );

  if (!engine.isReady) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Initializing audio engine...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-zinc-100">R3 Loop Engine</h2>

      <TransportBar
        state={engine.transportState}
        bpm={engine.bpm}
        onPlay={engine.startTransport}
        onStop={engine.stopTransport}
        onRecord={() => handleRecord('default')}
        onBpmChange={engine.setBpm}
        onStartInput={handleStartInput}
        onStopInput={handleStopInput}
        isInputActive={isInputActive}
      />

      <WaveformVisualizer getTimeDomainData={engine.getTimeDomainData} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Tracks
          </h3>
          <button
            onClick={handleAddTrack}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add Track
          </button>
        </div>

        {engine.tracks.map((track) => (
          <TrackLane
            key={track.id}
            track={track}
            onMute={handleMute}
            onSolo={handleSolo}
            onVolumeChange={engine.updateTrack}
            onPanChange={engine.updateTrack}
            onRemove={engine.removeTrack}
            onRecord={handleRecord}
            isRecording={recordingTrackId === track.id}
          />
        ))}
      </div>
    </div>
  );
}
