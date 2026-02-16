import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface EdgeOverlayProps {
  /** Edge map as ImageData from VisionService */
  edgeImageData: ImageData | null;
  /** Opacity 0-1 */
  opacity?: number;
  style?: object;
}

/**
 * Overlays the edge detection result on top of the camera view.
 * Web only: uses a canvas element created via DOM.
 */
export function EdgeOverlay({
  edgeImageData,
  opacity = 0.6,
  style,
}: EdgeOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const container = containerRef.current;
    if (!container) return;

    // Create canvas if needed
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;pointer-events:none;';
      container.appendChild(canvas);
      canvasRef.current = canvas;
    }

    return () => {
      canvasRef.current?.parentElement?.removeChild(canvasRef.current);
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !edgeImageData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.style.opacity = String(opacity);
    canvas.width = edgeImageData.width;
    canvas.height = edgeImageData.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(edgeImageData, 0, 0);
  }, [edgeImageData, opacity]);

  if (Platform.OS !== 'web') return null;

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
