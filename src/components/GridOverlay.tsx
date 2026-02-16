import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { Grid } from '../types';

interface GridOverlayProps {
  /** Detected grid or null */
  grid: Grid | null;
  /** Source image width (grid coordinates) */
  sourceWidth: number;
  /** Source image height (grid coordinates) */
  sourceHeight: number;
  /** Line color */
  color?: string;
  style?: object;
}

/**
 * Overlays the detected grid on the camera view.
 * Web only: uses canvas to draw grid lines.
 */
export function GridOverlay({
  grid,
  sourceWidth,
  sourceHeight,
  color = 'rgba(0, 255, 100, 0.6)',
  style,
}: GridOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const container = containerRef.current;
    if (!container) return;

    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;pointer-events:none;';
      container.appendChild(canvas);
      canvasRef.current = canvas;
    }

    return () => {
      canvasRef.current?.parentElement?.removeChild(canvasRef.current);
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !grid || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    const scaleX = rect.width / sourceWidth;
    const scaleY = rect.height / sourceHeight;

    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    const scale = (x: number, y: number) => ({
      x: x * scaleX,
      y: y * scaleY,
    });

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const cell = grid.cells[r][c];
        const tl = scale(cell.topLeft.x, cell.topLeft.y);
        const tr = scale(cell.topRight.x, cell.topRight.y);
        const bl = scale(cell.bottomLeft.x, cell.bottomLeft.y);
        const br = scale(cell.bottomRight.x, cell.bottomRight.y);

        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(bl.x, bl.y);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }, [grid, sourceWidth, sourceHeight, color]);

  if (Platform.OS !== 'web' || !grid) return null;

  return (
    <View style={[styles.overlay, style]} pointerEvents="none">
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        } as React.CSSProperties}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
