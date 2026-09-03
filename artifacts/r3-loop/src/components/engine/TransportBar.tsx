import { Play, Square, Circle, Mic, MicOff } from 'lucide-react';
import type { TransportState } from '../../engine';

interface TransportBarProps {
  state: TransportState;
  bpm: number;
  onPlay: () => void;
  onStop: () => void;
  onRecord: () => void;
  onBpmChange: (bpm: number) => void;
  onStartInput: () => void;
  onStopInput: () => void;
  isInputActive: boolean;
}

export function TransportBar({
  state,
  bpm,
  onPlay,
  onStop,
  onRecord,
  onBpmChange,
  onStartInput,
  onStopInput,
  isInputActive,
}: TransportBarProps) {
  const isPlaying = state === 'playing';
  const isRecording = state === 'recording';

  return (
    <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      {/* Play/Stop */}
      <button
        onClick={isPlaying ? onStop : onPlay}
        className={`p-3 rounded-full transition-colors ${
          isPlaying
            ? 'bg-amber-500 hover:bg-amber-600 text-black'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
        }`}
        title={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? <Square size={20} /> : <Play size={20} />}
      </button>

      {/* Record */}
      <button
        onClick={onRecord}
        className={`p-3 rounded-full transition-colors ${
          isRecording
            ? 'bg-red-500 animate-pulse text-white'
            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
        }`}
        title="Record"
      >
        <Circle size={20} />
      </button>

      {/* Input Toggle */}
      <button
        onClick={isInputActive ? onStopInput : onStartInput}
        className={`p-3 rounded-full transition-colors ${
          isInputActive
            ? 'bg-blue-500 text-white'
            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
        }`}
        title={isInputActive ? 'Stop Input' : 'Start Input'}
      >
        {isInputActive ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      {/* BPM Control */}
      <div className="flex items-center gap-2 ml-4">
        <span className="text-zinc-400 text-sm font-mono">BPM</span>
        <input
          type="number"
          min={20}
          max={300}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-20 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-center font-mono"
        />
      </div>

      {/* State Indicator */}
      <div className="ml-auto flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isRecording
              ? 'bg-red-500'
              : isPlaying
              ? 'bg-emerald-500'
              : 'bg-zinc-600'
          }`}
        />
        <span className="text-zinc-400 text-xs uppercase tracking-wider">
          {state}
        </span>
      </div>
    </div>
  );
}
