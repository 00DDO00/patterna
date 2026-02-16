import type { NoteSequence } from '../types';

/**
 * Sample pentatonic sequence for Phase 1 testing.
 * C-E-G-A pattern (steps 0, 4, 8, 12)
 */
export const DEMO_SEQUENCE: NoteSequence = [
  { step: 0, note: 'C', velocity: 200 },
  { step: 1, note: null, velocity: 0 },
  { step: 2, note: null, velocity: 0 },
  { step: 3, note: 'E', velocity: 180 },
  { step: 4, note: null, velocity: 0 },
  { step: 5, note: 'G', velocity: 220 },
  { step: 6, note: null, velocity: 0 },
  { step: 7, note: null, velocity: 0 },
  { step: 8, note: 'A', velocity: 190 },
  { step: 9, note: null, velocity: 0 },
  { step: 10, note: 'C', velocity: 160 },
  { step: 11, note: null, velocity: 0 },
  { step: 12, note: 'E', velocity: 200 },
  { step: 13, note: null, velocity: 0 },
  { step: 14, note: 'G', velocity: 180 },
  { step: 15, note: null, velocity: 0 },
];
