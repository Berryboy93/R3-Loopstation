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
