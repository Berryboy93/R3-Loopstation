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
