/**
 * R3-Loopstation Engine Core — Plugin Architecture
 * 
 * Defines the contract between the AudioEngine host and all plugins.
 * Every engine plugin must implement the EnginePlugin interface.
 */

export interface EnginePlugin {
  /** Unique identifier for the plugin instance */
  readonly id: string;

  /** Called once when the plugin is registered. Set up AudioNodes here. */
  initialize(ctx: AudioContext, core: EngineCore): void;

  /** Connect the plugin's output to the destination (master gain chain) */
  connect(destination: AudioNode): void;

  /** Disconnect all AudioNodes */
  disconnect(): void;

  /** Clean up resources (buffers, streams, event listeners) */
  destroy(): void;
}

export interface EngineCore {
  readonly context: AudioContext;
  readonly transport: Transport;
  readonly masterGain: GainNode;
  readonly analyser: AnalyserNode;
  registerPlugin(plugin: EnginePlugin): void;
  unregisterPlugin(id: string): void;
  getPlugin<T extends EnginePlugin>(id: string): T | undefined;
}

export type TransportState = 'stopped' | 'playing' | 'recording';

export interface Transport {
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly state: TransportState;
  readonly currentBeat: number;
  readonly currentTime: number; // audioContext time
  setBpm(bpm: number): void;
  start(): void;
  stop(): void;
  onTick(callback: (beat: number, time: number) => void): () => void;
  onStateChange(callback: (state: TransportState) => void): () => void;
}

export interface LoopBuffer {
  buffer: AudioBuffer;
  startTime: number;
  duration: number;
  trackId: string;
}

export interface TrackConfig {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
}
