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
