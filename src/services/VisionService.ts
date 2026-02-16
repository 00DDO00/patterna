import type { Frame, Grid, NoteSequence } from '../types';
import { grayscale, sobelEdgeDetect, edgesToImageData } from '../utils/imageProcessing';
import { detectGridFromEdges } from '../utils/gridDetection';
import { imageGridToNoteSequence } from '../utils/noteMapping';

/** Result of processing a single frame */
export interface ProcessedFrame {
  /** Grayscale pixel data */
  grayscale: Uint8Array;
  /** Edge magnitude per pixel */
  edges: Uint8Array;
  /** Edge map as ImageData (for display) */
  edgeImageData: ImageData;
  /** Detected grid (null if detection failed) */
  grid: Grid | null;
  /** Note sequence from pattern (null if no grid) */
  noteSequence: NoteSequence | null;
  /** Frame dimensions */
  width: number;
  height: number;
  /** Processing time in ms */
  processTimeMs: number;
}

/** Target processing resolution (smaller = faster) */
const EDGE_THRESHOLD = 40;
const TARGET_FPS = 15;
/** Cache grid for N frames when stable */
const GRID_CACHE_FRAMES = 5;

/**
 * Vision Service - processes camera frames through grayscale, edge detection, and grid extraction.
 */
export class VisionService {
  private frameCount = 0;
  private gridCache: Grid | null = null;
  private gridCacheAge = 0;

  /**
   * Process a frame: grayscale → edge detection → grid extraction.
   * Expects Frame.data to be ImageData (web) or compatible format.
   */
  processFrame(frame: Frame): ProcessedFrame | null {
    const imageData = frame.data as ImageData;
    if (!imageData || !imageData.data) return null;

    const start = performance.now();

    const { width, height } = frame;
    const gray = grayscale(imageData);
    const edges = sobelEdgeDetect(gray, width, height, EDGE_THRESHOLD);
    const edgeImageData = edgesToImageData(edges, width, height);

    let grid = detectGridFromEdges(edges, width, height);
    if (grid) {
      this.gridCache = grid;
      this.gridCacheAge = 0;
    } else if (this.gridCache) {
      this.gridCacheAge++;
      if (this.gridCacheAge < GRID_CACHE_FRAMES) {
        grid = this.gridCache;
      } else {
        this.gridCache = null;
      }
    }

    let noteSequence: NoteSequence | null = null;
    if (grid) {
      noteSequence = imageGridToNoteSequence(imageData, grid);
    }

    const processTimeMs = performance.now() - start;

    return {
      grayscale: gray,
      edges,
      edgeImageData,
      grid,
      noteSequence,
      width,
      height,
      processTimeMs,
    };
  }

  /**
   * Throttle: return true if this frame should be processed (target ~15fps).
   */
  shouldProcessFrame(): boolean {
    this.frameCount++;
    const interval = Math.round(60 / TARGET_FPS); // ~4 at 60fps for 15fps target
    if (this.frameCount % interval === 0) {
      return true;
    }
    return false;
  }

  /** Target processing FPS */
  get targetFps(): number {
    return TARGET_FPS;
  }
}
