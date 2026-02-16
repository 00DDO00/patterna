import type { Grid, CellCorners } from '../types';

/** Minimum gap between lines (pixels) */
const MIN_LINE_GAP = 8;
/** Minimum projection strength to consider a peak */
const MIN_PEAK_STRENGTH = 5;
/** Target grid size for normalization */
const TARGET_ROWS = 8;
const TARGET_COLS = 16;

/**
 * Find peak positions in a 1D projection using local maxima.
 */
function findPeaks(
  projection: number[],
  minGap: number = MIN_LINE_GAP
): { position: number; strength: number }[] {
  const peaks: { position: number; strength: number }[] = [];
  const halfGap = Math.floor(minGap / 2);

  for (let i = halfGap; i < projection.length - halfGap; i++) {
    const v = projection[i];
    if (v < MIN_PEAK_STRENGTH) continue;

    let isMax = true;
    for (let j = i - halfGap; j <= i + halfGap && isMax; j++) {
      if (j !== i && projection[j] > v) isMax = false;
    }
    if (isMax) {
      peaks.push({ position: i, strength: v });
    }
  }

  return peaks;
}

/**
 * Merge nearby lines, keeping the strongest in each cluster.
 */
function mergeNearbyLines(
  peaks: { position: number; strength: number }[],
  minGap: number
): number[] {
  if (peaks.length === 0) return [];
  const sorted = [...peaks].sort((a, b) => a.position - b.position);
  const merged: number[] = [];
  let cluster: { position: number; strength: number }[] = [];

  for (const p of sorted) {
    if (cluster.length === 0 || p.position - cluster[cluster.length - 1].position < minGap) {
      cluster.push(p);
    } else {
      const best = cluster.reduce((a, b) => (a.strength >= b.strength ? a : b));
      merged.push(best.position);
      cluster = [p];
    }
  }
  if (cluster.length > 0) {
    const best = cluster.reduce((a, b) => (a.strength >= b.strength ? a : b));
    merged.push(best.position);
  }

  return merged.sort((a, b) => a - b);
}

/**
 * Detect horizontal and vertical lines from edge map using projection.
 */
export function detectLines(
  edges: Uint8Array,
  width: number,
  height: number
): { horizontal: number[]; vertical: number[] } {
  const hProjection = new Array(height).fill(0);
  const vProjection = new Array(width).fill(0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = edges[y * width + x];
      hProjection[y] += v;
      vProjection[x] += v;
    }
  }

  const hPeaks = findPeaks(hProjection);
  const vPeaks = findPeaks(vProjection);

  const horizontal = mergeNearbyLines(hPeaks, MIN_LINE_GAP);
  const vertical = mergeNearbyLines(vPeaks, MIN_LINE_GAP);

  return { horizontal, vertical };
}

/**
 * Subsample array to target length, taking evenly spaced indices.
 */
function subsampleLines(lines: number[], targetCount: number): number[] {
  if (lines.length <= targetCount || targetCount <= 1) return lines;
  const result: number[] = [];
  for (let i = 0; i < targetCount; i++) {
    const idx = Math.round((i / (targetCount - 1)) * (lines.length - 1));
    result.push(lines[idx]);
  }
  return result.sort((a, b) => a - b);
}

/**
 * Extract grid from horizontal and vertical lines.
 * Lines define boundaries; cells are rectangles between consecutive lines.
 */
export function extractGrid(
  horizontal: number[],
  vertical: number[],
  width: number,
  height: number
): Grid | null {
  if (horizontal.length < 2 || vertical.length < 2) return null;

  // Add image bounds, filter valid lines
  const hFiltered = horizontal.filter((h) => h >= 2 && h <= height - 3);
  const vFiltered = vertical.filter((v) => v >= 2 && v <= width - 3);

  const hLines = [0, ...hFiltered, height - 1];
  const vLines = [0, ...vFiltered, width - 1];

  if (hLines.length < 2 || vLines.length < 2) return null;

  // Subsample to target grid size
  const hSelected = subsampleLines(hLines, Math.min(TARGET_ROWS + 1, hLines.length));
  const vSelected = subsampleLines(vLines, Math.min(TARGET_COLS + 1, vLines.length));

  const rows = hSelected.length - 1;
  const cols = vSelected.length - 1;

  const cells: CellCorners[][] = [];

  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = {
        topLeft: { x: vSelected[c], y: hSelected[r] },
        topRight: { x: vSelected[c + 1], y: hSelected[r] },
        bottomLeft: { x: vSelected[c], y: hSelected[r + 1] },
        bottomRight: { x: vSelected[c + 1], y: hSelected[r + 1] },
      };
    }
  }

  return { rows, cols, cells };
}

/**
 * Full pipeline: edges → lines → grid.
 */
export function detectGridFromEdges(
  edges: Uint8Array,
  width: number,
  height: number
): Grid | null {
  const { horizontal, vertical } = detectLines(edges, width, height);
  return extractGrid(horizontal, vertical, width, height);
}
