import * as Tone from 'tone';
import { Platform } from 'react-native';
import type { NoteSequence } from '../types';

/** Default BPM for the step sequencer */
const DEFAULT_BPM = 120;

/** Number of steps in the sequencer */
const SEQUENCE_STEPS = 16;

/** Subdivision for 16th notes */
const SUBDIVISION = '16n';

/** Create AudioContext: native browser on web (Tone.js compatible), react-native-audio-api on mobile */
function createAudioContext(): globalThis.AudioContext {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const AC = globalThis.AudioContext || (globalThis as unknown as { webkitAudioContext: typeof globalThis.AudioContext }).webkitAudioContext;
    return new AC();
  }
  const { AudioContext } = require('react-native-audio-api');
  return new AudioContext();
}

/**
 * Audio Engine - 16-step sequencer using Tone.js.
 * Requires audio context to be initialized (via init()) before use.
 */
export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private sequence: Tone.Sequence | null = null;
  private currentOctave = 4;
  private bpm = DEFAULT_BPM;
  private _initialized = false;

  /**
   * Initialize the audio context. Must be called after a user gesture (e.g. button press).
   * On web: uses native browser AudioContext (Tone.js compatible).
   * On mobile: uses react-native-audio-api.
   */
  async init(): Promise<void> {
    if (this._initialized) return;

    const audioContext = createAudioContext();
    if ('resume' in audioContext && typeof audioContext.resume === 'function') {
      await audioContext.resume();
    }
    Tone.setContext(audioContext as unknown as Tone.BaseContext);

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.3 },
    }).toDestination();

    Tone.getTransport().bpm.value = this.bpm;
    this._initialized = true;
  }

  /** Check if the engine has been initialized */
  get initialized(): boolean {
    return this._initialized;
  }

  /**
   * Update the note sequence. Replaces any existing sequence.
   */
  updateSequence(noteSequence: NoteSequence): void {
    if (!this.synth || !this._initialized) return;

    this.sequence?.dispose();
    this.sequence = null;

    // Pad or trim to 16 steps, include velocity per step
    type StepEvent = { note: string; velocity: number } | null;
    const steps: StepEvent[] = Array(SEQUENCE_STEPS).fill(null);
    noteSequence.forEach((step) => {
      const idx = step.step % SEQUENCE_STEPS;
      if (step.note) {
        steps[idx] = {
          note: `${step.note}${this.currentOctave}`,
          velocity: Math.min(1, step.velocity / 255),
        };
      }
    });

    this.sequence = new Tone.Sequence(
      (time, stepEvent) => {
        if (stepEvent && this.synth) {
          this.synth.triggerAttackRelease(
            stepEvent.note,
            SUBDIVISION,
            time,
            stepEvent.velocity
          );
        }
      },
      steps,
      SUBDIVISION
    );

    this.sequence.start(0);
  }

  /** Set the octave (2-6) */
  setOctave(octave: number): void {
    this.currentOctave = Math.max(2, Math.min(6, Math.round(octave)));
  }

  /** Get the current octave */
  getOctave(): number {
    return this.currentOctave;
  }

  /** Set BPM */
  setBpm(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, Math.round(bpm)));
    if (this._initialized) {
      Tone.getTransport().bpm.value = this.bpm;
    }
  }

  /** Get current BPM */
  getBpm(): number {
    return this.bpm;
  }

  /** Start playback */
  start(): void {
    if (!this._initialized) return;
    Tone.getTransport().start();
  }

  /** Stop playback */
  stop(): void {
    if (!this._initialized) return;
    Tone.getTransport().stop();
  }

  /** Check if transport is running */
  get isPlaying(): boolean {
    return this._initialized && Tone.getTransport().state === 'started';
  }
}
