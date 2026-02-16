import type { Cell, Grid, NoteSequence } from '../types';

/** Pentatonic scale notes */
const PENTATONIC = ['C', 'D', 'E', 'G', 'A'];

/** Brightness threshold for "active" cell */
const BRIGHTNESS_THRESHOLD = 128;

/** Number of steps in the sequencer */
const SEQUENCE_STEPS = 16;

/** Color quantization bucket size (0-255 → ~8 levels per channel) */
const COLOR_BUCKET = 32;

/**
 * Create a quantized color key for clustering.
 */
function colorKey(r: number, g: number, b: number): string {
  const qr = Math.floor(r / COLOR_BUCKET) * COLOR_BUCKET;
  const qg = Math.floor(g / COLOR_BUCKET) * COLOR_BUCKET;
  const qb = Math.floor(b / COLOR_BUCKET) * COLOR_BUCKET;
  return `${qr},${qg},${qb}`;
}

/**
 * Sample a single cell: average color in the center region.
 */
function sampleCell(
  imageData: ImageData,
  grid: Grid,
  row: number,
  col: number
): Cell {
  const cell = grid.cells[row][col];
  const xMin = Math.floor(cell.topLeft.x);
  const xMax = Math.floor(cell.topRight.x);
  const yMin = Math.floor(cell.topLeft.y);
  const yMax = Math.floor(cell.bottomLeft.y);

  const cx = Math.floor((xMin + xMax) / 2);
  const cy = Math.floor((yMin + yMax) / 2);

  const { data, width } = imageData;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  const radius = Math.max(1, Math.min(3, Math.floor((xMax - xMin) / 4)));
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x >= 0 && x < width && y >= 0 && y < imageData.height) {
        const i = (y * width + x) * 4;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }
  }

  if (count === 0) {
    const i = (cy * width + cx) * 4;
    r = data[i] ?? 0;
    g = data[i + 1] ?? 0;
    b = data[i + 2] ?? 0;
    count = 1;
  }

  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

  return {
    row,
    col,
    center: { x: cx, y: cy },
    color: [r, g, b],
    brightness,
  };
}

/**
 * Sample all grid cells from the image.
 */
export function sampleCells(imageData: ImageData, grid: Grid): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      cells.push(sampleCell(imageData, grid, r, c));
    }
  }
  return cells;
}

/**
 * Map sampled cells to a NoteSequence.
 * Uses color clustering and brightness threshold.
 */
export function mapToNotes(cells: Cell[]): NoteSequence {
  const steps: NoteSequence = [];
  const activeCells = cells.slice(0, SEQUENCE_STEPS);

  const colorKeys = new Map<string, number>();
  let colorIndex = 0;

  for (const cell of activeCells) {
    const [r, g, b] = cell.color;
    const key = colorKey(r, g, b);
    if (!colorKeys.has(key)) {
      colorKeys.set(key, colorIndex % PENTATONIC.length);
      colorIndex++;
    }
  }

  for (let i = 0; i < SEQUENCE_STEPS; i++) {
    const cell = activeCells[i];
    if (!cell) {
      steps.push({ step: i, note: null, velocity: 0 });
      continue;
    }

    const isActive = cell.brightness > BRIGHTNESS_THRESHOLD;
    const key = colorKey(cell.color[0], cell.color[1], cell.color[2]);
    const noteIndex = colorKeys.get(key) ?? 0;
    const note = isActive ? PENTATONIC[noteIndex] : null;

    steps.push({
      step: i,
      note,
      velocity: cell.brightness,
    });
  }

  return steps;
}

/**
 * Full pipeline: image + grid → cells → NoteSequence.
 */
export function imageGridToNoteSequence(
  imageData: ImageData,
  grid: Grid
): NoteSequence {
  const cells = sampleCells(imageData, grid);
  return mapToNotes(cells);
}
