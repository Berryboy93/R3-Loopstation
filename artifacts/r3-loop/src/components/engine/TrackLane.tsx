import { Volume2, VolumeX, Headphones, Trash2 } from 'lucide-react';
import type { TrackConfig } from '../../engine';

interface TrackLaneProps {
  track: TrackConfig;
  onMute: (id: string) => void;
  onSolo: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onPanChange: (id: string, pan: number) => void;
  onRemove: (id: string) => void;
  onRecord: (id: string) => void;
  isRecording: boolean;
}

export function TrackLane({
  track,
  onMute,
  onSolo,
  onVolumeChange,
  onPanChange,
  onRemove,
  onRecord,
  isRecording,
}: TrackLaneProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800"
      style={{ borderLeftColor: track.color, borderLeftWidth: 4 }}
    >
      {/* Track Name */}
      <span className="w-24 text-sm font-medium text-zinc-200 truncate">
        {track.name}
      </span>

      {/* Mute */}
      <button
        onClick={() => onMute(track.id)}
        className={`p-1.5 rounded ${
          track.muted ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
        title="Mute"
      >
        {track.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Solo */}
      <button
        onClick={() => onSolo(track.id)}
        className={`p-1.5 rounded ${
          track.solo ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
        title="Solo"
      >
        <Headphones size={16} />
      </button>

      {/* Record Arm */}
      <button
        onClick={() => onRecord(track.id)}
        className={`p-1.5 rounded ${
          isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-zinc-500 hover:text-zinc-300'
        }`}
        title="Arm Record"
      >
        <div className="w-3 h-3 rounded-full bg-current" />
      </button>

      {/* Volume */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-xs text-zinc-500 w-8">Vol</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={track.volume}
          onChange={(e) => onVolumeChange(track.id, Number(e.target.value))}
          className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-zinc-500 w-8 text-right">
          {Math.round(track.volume * 100)}%
        </span>
      </div>

      {/* Pan */}
      <div className="flex items-center gap-2 w-32">
        <span className="text-xs text-zinc-500">L</span>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={track.pan}
          onChange={(e) => onPanChange(track.id, Number(e.target.value))}
          className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-zinc-500">R</span>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(track.id)}
        className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
        title="Remove Track"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
