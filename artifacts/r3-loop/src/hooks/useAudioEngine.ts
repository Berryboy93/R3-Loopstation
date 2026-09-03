import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioEngine, LooperPlugin, VisualizerPlugin } from '../engine';
import type { TransportState, TrackConfig } from '../engine';

export interface UseAudioEngineReturn {
  /** Whether the engine has been initialized */
  isReady: boolean;
  /** Current transport state */
  transportState: TransportState;
  /** Current BPM */
  bpm: number;
  /** All configured tracks */
  tracks: TrackConfig[];
  /** Resume AudioContext (call after user gesture) */
  resume: () => Promise<void>;
  /** Start transport playback */
  startTransport: () => void;
  /** Stop transport */
  stopTransport: () => void;
  /** Set BPM */
  setBpm: (bpm: number) => void;
  /** Start audio input (microphone) */
  startInput: (deviceId?: string) => Promise<void>;
  /** Stop audio input */
  stopInput: () => void;
  /** Toggle recording on active track */
  toggleRecord: (trackId?: string) => void;
  /** Add a new track */
  addTrack: (config: TrackConfig) => void;
  /** Update track properties */
  updateTrack: (id: string, updates: Partial<TrackConfig>) => void;
  /** Remove a track */
  removeTrack: (id: string) => void;
  /** Get frequency data for visualization */
  getFrequencyData: () => Uint8Array | null;
  /** Get time-domain data for waveform */
  getTimeDomainData: () => Float32Array | null;
  /** Clear all recorded loops */
  clearLoops: () => void;
}

export function useAudioEngine(): UseAudioEngineReturn {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [transportState, setTransportState] = useState<TransportState>('stopped');
  const [bpm, setBpmState] = useState(120);
  const [tracks, setTracks] = useState<TrackConfig[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;

    // Register core plugins
    const looper = new LooperPlugin();
    engine.registerPlugin(looper);

    const visualizer = new VisualizerPlugin();
    engine.registerPlugin(visualizer);

    // Subscribe to transport state
    const unsubState = engine.transport.onStateChange((state) => {
      setTransportState(state);
    });

    // Poll track list
    const pollTracks = () => {
      const looperPlugin = engine.getPlugin<LooperPlugin>('looper');
      if (looperPlugin) {
        setTracks(looperPlugin.getTracks());
      }
      rafRef.current = requestAnimationFrame(pollTracks);
    };
    rafRef.current = requestAnimationFrame(pollTracks);

    setIsReady(true);

    return () => {
      cancelAnimationFrame(rafRef.current);
      unsubState();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const resume = useCallback(async () => {
    await engineRef.current?.resume();
  }, []);

  const startTransport = useCallback(() => {
    engineRef.current?.transport.start();
  }, []);

  const stopTransport = useCallback(() => {
    engineRef.current?.transport.stop();
  }, []);

  const setBpm = useCallback((value: number) => {
    setBpmState(value);
    engineRef.current?.transport.setBpm(value);
  }, []);

  const startInput = useCallback(
    async (deviceId?: string) => {
      await resume();
      const looper = engineRef.current?.getPlugin<LooperPlugin>('looper');
      await looper?.startInput(deviceId);
    },
    [resume]
  );

  const stopInput = useCallback(() => {
    engineRef.current?.getPlugin<LooperPlugin>('looper')?.stopInput();
  }, []);

  const toggleRecord = useCallback((trackId?: string) => {
    engineRef.current?.getPlugin<LooperPlugin>('looper')?.toggleRecord(trackId);
  }, []);

  const addTrack = useCallback((config: TrackConfig) => {
    engineRef.current?.getPlugin<LooperPlugin>('looper')?.addTrack(config);
  }, []);

  const updateTrack = useCallback((id: string, updates: Partial<TrackConfig>) => {
    engineRef.current?.getPlugin<LooperPlugin>('looper')?.updateTrack(id, updates);
  }, []);

  const removeTrack = useCallback((id: string) => {
    engineRef.current?.getPlugin<LooperPlugin>('looper')?.removeTrack(id);
  }, []);

  const getFrequencyData = useCallback(() => {
    return engineRef.current?.getPlugin<VisualizerPlugin>('visualizer')?.getFrequencyData() ?? null;
  }, []);

  const getTimeDomainData = useCallback(() => {
    return engineRef.current?.getPlugin<VisualizerPlugin>('visualizer')?.getTimeDomainData() ?? null;
  }, []);

  const clearLoops = useCallback(() => {
    engineRef.current?.getPlugin<LooperPlugin>('looper')?.clearLoops();
  }, []);

  return {
    isReady,
    transportState,
    bpm,
    tracks,
    resume,
    startTransport,
    stopTransport,
    setBpm,
    startInput,
    stopInput,
    toggleRecord,
    addTrack,
    updateTrack,
    removeTrack,
    getFrequencyData,
    getTimeDomainData,
    clearLoops,
  };
}
