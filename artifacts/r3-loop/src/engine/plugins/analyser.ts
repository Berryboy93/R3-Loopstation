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
