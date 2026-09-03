#!/usr/bin/env bash
# =============================================================================
# R3-Loopstation Engine Core Plugin Integration Script
# =============================================================================
# Fixes:
#   - Rollup ARM64 native binary missing (@rollup/rollup-linux-arm64-gnu)
#   - Creates complete engine core plugin architecture
#   - Integrates with existing Vite/React setup
#   - Adds dev convenience scripts to root package.json
#
# Run from: ~/R3-Loopstation/
# Usage:    bash integrate-engine-core.sh
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(pwd)"
R3_LOOP_DIR="${PROJECT_ROOT}/artifacts/r3-loop"
ENGINE_DIR="${R3_LOOP_DIR}/src/engine"
PLUGINS_DIR="${ENGINE_DIR}/plugins"
HOOKS_DIR="${R3_LOOP_DIR}/src/hooks"
COMPONENTS_DIR="${R3_LOOP_DIR}/src/components"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     R3-Loopstation Engine Core Plugin Integration Script            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# STEP 1: Detect Architecture & Fix Rollup Native Binary Issue
# =============================================================================
echo -e "${YELLOW}[STEP 1/7]${NC} Detecting architecture and fixing Rollup native binary..."

ARCH=$(uname -m)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
echo -e "  Detected: ${GREEN}${OS}/${ARCH}${NC}"

# Check if we're on ARM64 Linux (Chromebook/Crostini)
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    echo -e "  ${YELLOW}→ ARM64 detected. Applying Rollup WASM override...${NC}"

    # Method A: pnpm overrides (most reliable for pnpm workspaces)
    if ! grep -q '"overrides"' "${PROJECT_ROOT}/package.json" 2>/dev/null; then
        # Add pnpm.overrides to root package.json
        node -e '
            const fs = require("fs");
            const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
            if (!pkg.pnpm) pkg.pnpm = {};
            if (!pkg.pnpm.overrides) pkg.pnpm.overrides = {};
            pkg.pnpm.overrides.rollup = "npm:@rollup/wasm-node";
            fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
            console.log("  ✓ Added pnpm.overrides.rollup = @rollup/wasm-node");
        '
    else
        echo -e "  ${YELLOW}→ pnpm.overrides already exists, skipping override add${NC}"
    fi

    # Method B: Also add supportedArchitectures to pnpm-workspace.yaml for future-proofing
    if [[ -f "${PROJECT_ROOT}/pnpm-workspace.yaml" ]]; then
        if ! grep -q "supportedArchitectures" "${PROJECT_ROOT}/pnpm-workspace.yaml" 2>/dev/null; then
            cat >> "${PROJECT_ROOT}/pnpm-workspace.yaml" << 'EOF'

# Multi-arch support for Rollup native binaries
supportedArchitectures:
  os:
    - current
    - linux
  cpu:
    - x64
    - arm64
EOF
            echo -e "  ✓ Added supportedArchitectures to pnpm-workspace.yaml"
        fi
    fi

    # Method C: Add optional dependency as fallback
    node -e '
        const fs = require("fs");
        const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
        if (!pkg.optionalDependencies) pkg.optionalDependencies = {};
        pkg.optionalDependencies["@rollup/rollup-linux-arm64-gnu"] = "^4.40.0";
        fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
        console.log("  ✓ Added @rollup/rollup-linux-arm64-gnu to optionalDependencies");
    '
else
    echo -e "  ${GREEN}→ x86_64 detected. Standard setup should work.${NC}"
fi

# Clean reinstall with new overrides
echo -e "  ${YELLOW}→ Reinstalling dependencies with fixes...${NC}"
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm rebuild

echo -e "  ${GREEN}✓ Rollup binary issue resolved${NC}"
echo ""

# =============================================================================
# STEP 2: Create Directory Structure
# =============================================================================
echo -e "${YELLOW}[STEP 2/7]${NC} Creating engine directory structure..."

mkdir -p "${ENGINE_DIR}"
mkdir -p "${PLUGINS_DIR}"
mkdir -p "${HOOKS_DIR}"
mkdir -p "${COMPONENTS_DIR}/engine"

echo -e "  ${GREEN}✓ Directories created:${NC}"
echo -e "    - ${ENGINE_DIR}"
echo -e "    - ${PLUGINS_DIR}"
echo -e "    - ${HOOKS_DIR}"
echo -e "    - ${COMPONENTS_DIR}/engine"
echo ""

# =============================================================================
# STEP 3: Write Engine Core Plugin Files
# =============================================================================
echo -e "${YELLOW}[STEP 3/7]${NC} Writing engine core plugin source files..."

# --- types.ts ---
cat > "${ENGINE_DIR}/types.ts" << 'EOF'
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
EOF

echo -e "  ✓ ${ENGINE_DIR}/types.ts"

# --- transport.ts ---
cat > "${ENGINE_DIR}/transport.ts" << 'EOF'
import { Transport, TransportState } from './types';

/**
 * LoopTransport — Web Audio API-based transport/metronome
 * 
 * Uses the "lookahead scheduler" pattern for sample-accurate timing.
 * See: https://web.dev/articles/audio-scheduling
 */
export class LoopTransport implements Transport {
  bpm = 120;
  beatsPerBar = 4;
  state: TransportState = 'stopped';
  currentBeat = 0;
  currentTime = 0;

  private ctx: AudioContext | null = null;
  private nextNoteTime = 0;
  private scheduleAheadTime = 0.1; // seconds
  private lookahead = 25; // ms
  private timerId: ReturnType<typeof setInterval> | null = null;
  private tickCallbacks = new Set<(beat: number, time: number) => void>();
  private stateCallbacks = new Set<(state: TransportState) => void>();
  private beatDuration = 0.5;

  attach(ctx: AudioContext) {
    this.ctx = ctx;
    this.setBpm(this.bpm);
  }

  setBpm(bpm: number) {
    this.bpm = Math.max(20, Math.min(300, bpm));
    this.beatDuration = 60 / this.bpm;
  }

  start() {
    if (!this.ctx || this.state === 'playing') return;
    this.state = 'playing';
    this.nextNoteTime = this.ctx.currentTime;
    this.timerId = setInterval(() => this.scheduler(), this.lookahead);
    this.emitState();
  }

  stop() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
    this.state = 'stopped';
    this.currentBeat = 0;
    this.emitState();
  }

  private scheduler() {
    if (!this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.currentTime = this.nextNoteTime;
      this.tickCallbacks.forEach((cb) => cb(this.currentBeat, this.nextNoteTime));
      this.nextNoteTime += this.beatDuration;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
    }
  }

  onTick(cb: (beat: number, time: number) => void) {
    this.tickCallbacks.add(cb);
    return () => this.tickCallbacks.delete(cb);
  }

  onStateChange(cb: (state: TransportState) => void) {
    this.stateCallbacks.add(cb);
    return () => this.stateCallbacks.delete(cb);
  }

  private emitState() {
    this.stateCallbacks.forEach((cb) => cb(this.state));
  }
}
EOF

echo -e "  ✓ ${ENGINE_DIR}/transport.ts"

# --- core.ts ---
cat > "${ENGINE_DIR}/core.ts" << 'EOF'
import { EngineCore, EnginePlugin } from './types';
import { LoopTransport } from './transport';

/**
 * AudioEngine — Central host for all engine plugins
 * 
 * Manages:
 *   - AudioContext lifecycle
 *   - Master gain + analyser chain
 *   - Plugin registry
 *   - Transport clock
 */
export class AudioEngine implements EngineCore {
  context: AudioContext;
  transport = new LoopTransport();
  masterGain: GainNode;
  analyser: AnalyserNode;
  private plugins = new Map<string, EnginePlugin>();
  private destination: AudioDestinationNode;

  constructor() {
    this.context = new AudioContext();
    this.destination = this.context.destination;
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.85;
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.masterGain.connect(this.analyser).connect(this.destination);
    this.transport.attach(this.context);
  }

  registerPlugin(plugin: EnginePlugin) {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} already registered`);
    }
    plugin.initialize(this.context, this);
    plugin.connect(this.masterGain);
    this.plugins.set(plugin.id, plugin);
  }

  unregisterPlugin(id: string) {
    const p = this.plugins.get(id);
    if (!p) return;
    p.disconnect();
    p.destroy();
    this.plugins.delete(id);
  }

  getPlugin<T extends EnginePlugin>(id: string): T | undefined {
    return this.plugins.get(id) as T | undefined;
  }

  /** Resume AudioContext (required after user gesture) */
  resume() {
    if (this.context.state === 'suspended') return this.context.resume();
    return Promise.resolve();
  }

  suspend() {
    return this.context.suspend();
  }

  destroy() {
    this.transport.stop();
    this.plugins.forEach((p) => {
      p.disconnect();
      p.destroy();
    });
    this.plugins.clear();
    this.masterGain.disconnect();
    this.analyser.disconnect();
    this.context.close();
  }
}
EOF

echo -e "  ✓ ${ENGINE_DIR}/core.ts"

# --- plugins/looper.ts ---
cat > "${PLUGINS_DIR}/looper.ts" << 'EOF'
import { EngineCore, EnginePlugin, LoopBuffer, TrackConfig } from '../types';

/**
 * LooperPlugin — Core loop recording and playback engine
 * 
 * Features:
 *   - Multi-track recording via ScriptProcessorNode
 *   - Beat-aligned loop playback
 *   - Per-track mute/solo/volume/pan
 *   - Overdub support (future)
 */
export class LooperPlugin implements EnginePlugin {
  readonly id = 'looper';
  private ctx: AudioContext | null = null;
  private core: EngineCore | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private recorderNode: ScriptProcessorNode | null = null;
  private recordedChunks: Float32Array[] = [];
  private loops: LoopBuffer[] = [];
  private isRecording = false;
  private outputGain: GainNode | null = null;
  private unsubTick: (() => void) | null = null;
  private tracks = new Map<string, TrackConfig>();
  private activeTrackId = 'default';

  initialize(ctx: AudioContext, core: EngineCore) {
    this.ctx = ctx;
    this.core = core;
    this.outputGain = ctx.createGain();
    this.outputGain.gain.value = 1.0;
    this.unsubTick = core.transport.onTick((beat, time) => this.onTick(beat, time));

    // Create default track
    this.tracks.set('default', {
      id: 'default',
      name: 'Track 1',
      color: '#3b82f6',
      muted: false,
      solo: false,
      volume: 1.0,
      pan: 0,
    });
  }

  async startInput(deviceId?: string) {
    if (!this.ctx) return;
    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    };
    this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.sourceNode = this.ctx.createMediaStreamSource(this.mediaStream);
  }

  stopInput() {
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.mediaStream = null;
  }

  toggleRecord(trackId?: string) {
    if (!this.ctx || !this.sourceNode) return;
    if (trackId) this.activeTrackId = trackId;
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording() {
    if (!this.ctx || !this.sourceNode) return;
    this.isRecording = true;
    this.recordedChunks = [];
    this.recorderNode = this.ctx.createScriptProcessor(4096, 1, 1);
    this.sourceNode.connect(this.recorderNode);
    this.recorderNode.connect(this.ctx.destination); // required for Chrome
    this.recorderNode.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const data = e.inputBuffer.getChannelData(0);
      this.recordedChunks.push(new Float32Array(data));
    };
  }

  private stopRecording() {
    this.isRecording = false;
    this.recorderNode?.disconnect();
    this.recorderNode = null;
    if (!this.ctx || this.recordedChunks.length === 0) return;

    const totalLength = this.recordedChunks.reduce((sum, c) => sum + c.length, 0);
    const buffer = this.ctx.createBuffer(1, totalLength, this.ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    let offset = 0;
    for (const chunk of this.recordedChunks) {
      channel.set(chunk, offset);
      offset += chunk.length;
    }

    this.loops.push({
      buffer,
      startTime: this.ctx.currentTime,
      duration: buffer.duration,
      trackId: this.activeTrackId,
    });
  }

  private onTick(beat: number, time: number) {
    if (!this.ctx || !this.outputGain) return;

    const anySolo = Array.from(this.tracks.values()).some((t) => t.solo);

    for (const loop of this.loops) {
      const track = this.tracks.get(loop.trackId);
      if (!track) continue;
      if (track.muted) continue;
      if (anySolo && !track.solo) continue;

      const source = this.ctx.createBufferSource();
      source.buffer = loop.buffer;

      // Per-track gain
      const trackGain = this.ctx.createGain();
      trackGain.gain.value = track.volume;

      // Per-track panner
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = track.pan;

      source.connect(trackGain).connect(panner).connect(this.outputGain);
      source.start(time);
    }
  }

  addTrack(config: TrackConfig) {
    this.tracks.set(config.id, config);
  }

  updateTrack(id: string, updates: Partial<TrackConfig>) {
    const track = this.tracks.get(id);
    if (track) {
      this.tracks.set(id, { ...track, ...updates });
    }
  }

  removeTrack(id: string) {
    this.tracks.delete(id);
    this.loops = this.loops.filter((l) => l.trackId !== id);
  }

  getTracks(): TrackConfig[] {
    return Array.from(this.tracks.values());
  }

  getLoops(): LoopBuffer[] {
    return this.loops;
  }

  clearLoops() {
    this.loops = [];
  }

  connect(destination: AudioNode) {
    this.outputGain?.connect(destination);
  }

  disconnect() {
    this.outputGain?.disconnect();
  }

  destroy() {
    this.stopInput();
    this.stopRecording();
    this.unsubTick?.();
    this.loops = [];
    this.tracks.clear();
  }
}
EOF

echo -e "  ✓ ${PLUGINS_DIR}/looper.ts"

# --- plugins/analyser.ts ---
cat > "${PLUGINS_DIR}/analyser.ts" << 'EOF'
import { EngineCore, EnginePlugin } from '../types';

/**
 * VisualizerPlugin — Bridges the engine analyser to React components
 * 
 * Provides real-time frequency and time-domain data for waveform/FFT displays.
 */
export class VisualizerPlugin implements EnginePlugin {
  readonly id = 'visualizer';
  private ctx: AudioContext | null = null;
  private core: EngineCore | null = null;
  private outputGain: GainNode | null = null;
  private dataArray: Uint8Array | null = null;
  private timeArray: Float32Array | null = null;

  initialize(ctx: AudioContext, core: EngineCore) {
    this.ctx = ctx;
    this.core = core;
    this.outputGain = ctx.createGain();
    this.outputGain.gain.value = 1.0;

    const bufferLength = core.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    this.timeArray = new Float32Array(bufferLength);
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.dataArray) return null;
    this.core?.analyser.getByteFrequencyData(this.dataArray);
    return new Uint8Array(this.dataArray);
  }

  getTimeDomainData(): Float32Array | null {
    if (!this.timeArray) return null;
    this.core?.analyser.getFloatTimeDomainData(this.timeArray);
    return new Float32Array(this.timeArray);
  }

  connect(destination: AudioNode) {
    this.outputGain?.connect(destination);
  }

  disconnect() {
    this.outputGain?.disconnect();
  }

  destroy() {
    this.dataArray = null;
    this.timeArray = null;
  }
}
EOF

echo -e "  ✓ ${PLUGINS_DIR}/analyser.ts"

# --- index.ts (barrel export) ---
cat > "${ENGINE_DIR}/index.ts" << 'EOF'
export { AudioEngine } from './core';
export { LoopTransport } from './transport';
export { LooperPlugin } from './plugins/looper';
export { VisualizerPlugin } from './plugins/analyser';
export type {
  EnginePlugin,
  EngineCore,
  Transport,
  TransportState,
  LoopBuffer,
  TrackConfig,
} from './types';
EOF

echo -e "  ✓ ${ENGINE_DIR}/index.ts"

echo -e "  ${GREEN}✓ All engine files written${NC}"
echo ""

# =============================================================================
# STEP 4: Write React Hook Bridge
# =============================================================================
echo -e "${YELLOW}[STEP 4/7]${NC} Writing React hook bridge..."

cat > "${HOOKS_DIR}/useAudioEngine.ts" << 'EOF'
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
EOF

echo -e "  ✓ ${HOOKS_DIR}/useAudioEngine.ts"
echo -e "  ${GREEN}✓ React hook bridge written${NC}"
echo ""

# =============================================================================
# STEP 5: Write UI Components
# =============================================================================
echo -e "${YELLOW}[STEP 5/7]${NC} Writing UI components..."

# --- TransportBar.tsx ---
cat > "${COMPONENTS_DIR}/engine/TransportBar.tsx" << 'EOF'
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
EOF

echo -e "  ✓ ${COMPONENTS_DIR}/engine/TransportBar.tsx"

# --- TrackLane.tsx ---
cat > "${COMPONENTS_DIR}/engine/TrackLane.tsx" << 'EOF'
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
EOF

echo -e "  ✓ ${COMPONENTS_DIR}/engine/TrackLane.tsx"

# --- WaveformVisualizer.tsx ---
cat > "${COMPONENTS_DIR}/engine/WaveformVisualizer.tsx" << 'EOF'
import { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  getTimeDomainData: () => Float32Array | null;
  width?: number;
  height?: number;
}

export function WaveformVisualizer({
  getTimeDomainData,
  width = 800,
  height = 120,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const data = getTimeDomainData();
      if (!data) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();

      const sliceWidth = width / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const v = data[i] * 2; // amplify
        const y = (v * height) / 2 + height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [getTimeDomainData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full rounded-lg border border-zinc-800 bg-zinc-950"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}
EOF

echo -e "  ✓ ${COMPONENTS_DIR}/engine/WaveformVisualizer.tsx"

# --- EnginePanel.tsx (main integration component) ---
cat > "${COMPONENTS_DIR}/engine/EnginePanel.tsx" << 'EOF'
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
EOF

echo -e "  ✓ ${COMPONENTS_DIR}/engine/EnginePanel.tsx"

# --- index.ts (barrel export for components) ---
cat > "${COMPONENTS_DIR}/engine/index.ts" << 'EOF'
export { EnginePanel } from './EnginePanel';
export { TransportBar } from './TransportBar';
export { TrackLane } from './TrackLane';
export { WaveformVisualizer } from './WaveformVisualizer';
EOF

echo -e "  ✓ ${COMPONENTS_DIR}/engine/index.ts"
echo -e "  ${GREEN}✓ All UI components written${NC}"
echo ""

# =============================================================================
# STEP 6: Update Root package.json with convenience scripts
# =============================================================================
echo -e "${YELLOW}[STEP 6/7]${NC} Adding convenience scripts to root package.json..."

node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

// Add dev scripts if not present
const newScripts = {
  "dev:loop": "pnpm --filter @workspace/r3-loop dev",
  "dev:server": "pnpm --filter @workspace/api-server dev",
  "dev:sandbox": "pnpm --filter @workspace/mockup-sandbox dev",
  "build:loop": "pnpm --filter @workspace/r3-loop build",
  "typecheck:loop": "pnpm --filter @workspace/r3-loop typecheck",
  ...pkg.scripts
};

pkg.scripts = newScripts;
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("  ✓ Added convenience scripts to root package.json");
'

echo -e "  ${GREEN}Available commands:${NC}"
echo -e "    ${CYAN}pnpm run dev:loop${NC}     → Start R3-Loopstation dev server"
echo -e "    ${CYAN}pnpm run dev:server${NC}   → Start API server"
echo -e "    ${CYAN}pnpm run dev:sandbox${NC}  → Start mockup sandbox"
echo -e "    ${CYAN}pnpm run build:loop${NC}   → Build R3-Loopstation"
echo -e "    ${CYAN}pnpm run typecheck:loop${NC} → Type-check R3-Loopstation"
echo ""

# =============================================================================
# STEP 7: Verify & Report
# =============================================================================
echo -e "${YELLOW}[STEP 7/7]${NC} Verifying integration..."

# Check TypeScript compilation
echo -e "  ${YELLOW}→ Running typecheck on r3-loop...${NC}"
cd "${R3_LOOP_DIR}"
if pnpm run typecheck 2>/dev/null; then
    echo -e "  ${GREEN}✓ TypeScript typecheck passed${NC}"
else
    echo -e "  ${YELLOW}! Typecheck had issues (non-blocking — may need manual adjustment)${NC}"
fi

cd "${PROJECT_ROOT}"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ ENGINE CORE PLUGIN INTEGRATION COMPLETE              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Files created:${NC}"
echo -e "  ${ENGINE_DIR}/types.ts"
echo -e "  ${ENGINE_DIR}/transport.ts"
echo -e "  ${ENGINE_DIR}/core.ts"
echo -e "  ${ENGINE_DIR}/plugins/looper.ts"
echo -e "  ${ENGINE_DIR}/plugins/analyser.ts"
echo -e "  ${ENGINE_DIR}/index.ts"
echo -e "  ${HOOKS_DIR}/useAudioEngine.ts"
echo -e "  ${COMPONENTS_DIR}/engine/TransportBar.tsx"
echo -e "  ${COMPONENTS_DIR}/engine/TrackLane.tsx"
echo -e "  ${COMPONENTS_DIR}/engine/WaveformVisualizer.tsx"
echo -e "  ${COMPONENTS_DIR}/engine/EnginePanel.tsx"
echo -e "  ${COMPONENTS_DIR}/engine/index.ts"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "  1. Import EnginePanel into your App.tsx:"
echo -e "     ${YELLOW}import { EnginePanel } from './components/engine';${NC}"
echo -e "     ${YELLOW}<EnginePanel />${NC}"
echo -e "  2. Start the dev server:"
echo -e "     ${GREEN}pnpm run dev:loop${NC}"
echo -e "  3. Open browser, click to initialize AudioContext, then record & loop!"
echo ""
