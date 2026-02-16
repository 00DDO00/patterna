/**
 * Core types for the Pattern-to-Music step sequencer.
 * Used across Vision Pipeline, Mapping Engine, and Audio Engine.
 */

/** Raw camera frame data for processing */
export interface Frame {
  /** Image data (e.g. base64, URI, or pixel buffer) */
  data: unknown;
  /** Frame width in pixels */
  width: number;
  /** Frame height in pixels */
  height: number;
  /** Timestamp when frame was captured */
  timestamp: number;
}

/** 2D point (x, y) */
export interface Point {
  x: number;
  y: number;
}

/** Detected grid structure from vision pipeline */
export interface Grid {
  /** Number of rows */
  rows: number;
  /** Number of columns */
  cols: number;
  /** Corner points for each cell [row][col] -> { topLeft, topRight, bottomLeft, bottomRight } */
  cells: CellCorners[][];
}

/** Corner points defining a single grid cell */
export interface CellCorners {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

/** Sampled cell data from a grid cell */
export interface Cell {
  /** Grid row index */
  row: number;
  /** Grid column index */
  col: number;
  /** Center point of the cell */
  center: Point;
  /** RGB color [0-255, 0-255, 0-255] */
  color: [number, number, number];
  /** Brightness 0-255 */
  brightness: number;
}

/** A single step in the note sequence */
export interface NoteSequenceStep {
  /** Step index (0-15 for 16-step sequencer) */
  step: number;
  /** Note name (e.g. 'C', 'D', 'G') or null if step is silent */
  note: string | null;
  /** Velocity 0-255 */
  velocity: number;
}

/** Full note sequence for the step sequencer */
export type NoteSequence = NoteSequenceStep[];
