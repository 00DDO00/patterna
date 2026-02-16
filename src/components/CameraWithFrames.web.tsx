import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EdgeOverlay } from './EdgeOverlay';
import { GridOverlay } from './GridOverlay';
import { VisionService } from '../services/VisionService';
import { useCameraFrames } from '../hooks/useCameraFrames';
import type { ProcessedFrame } from '../services/VisionService';

interface CameraWithFramesProps {
  style?: object;
  /** Show edge detection overlay */
  showEdgeOverlay?: boolean;
  /** Called when a frame is processed */
  onProcessedFrame?: (result: ProcessedFrame) => void;
  /** Called when vision capture starts/stops */
  onVisionActiveChange?: (active: boolean) => void;
}

/**
 * Web-specific: Camera with frame capture and vision processing.
 * Uses HTML video + canvas for frame capture.
 */
export function CameraWithFrames({
  style,
  showEdgeOverlay = true,
  onProcessedFrame,
  onVisionActiveChange,
}: CameraWithFramesProps) {
  const visionServiceRef = useRef(new VisionService());
  const [edgeData, setEdgeData] = useState<ImageData | null>(null);
  const [grid, setGrid] = useState<import('../types').Grid | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [processTimeMs, setProcessTimeMs] = useState<number | null>(null);
  const [captureActive, setCaptureActive] = useState(false);

  const handleFrame = useCallback(
    (frame: { data: unknown; width: number; height: number; timestamp: number }) => {
      const vision = visionServiceRef.current;
      if (!vision.shouldProcessFrame()) return;

      const result = vision.processFrame(frame);
      if (!result) return;

      setEdgeData(result.edgeImageData);
      setGrid(result.grid);
      setFrameSize({ width: result.width, height: result.height });
      setProcessTimeMs(result.processTimeMs);
      onProcessedFrame?.(result);
    },
    [onProcessedFrame]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  const { ready, error, start, stop } = useCameraFrames({
    onFrame: handleFrame,
    active: captureActive,
    containerRef,
  });

  const handleToggleCapture = useCallback(() => {
    if (captureActive) {
      stop();
      setCaptureActive(false);
      setEdgeData(null);
      setGrid(null);
      onVisionActiveChange?.(false);
    } else {
      start();
      setCaptureActive(true);
      onVisionActiveChange?.(true);
    }
  }, [captureActive, start, stop, onVisionActiveChange]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.videoWrapper}>
        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: 'relative',
            minHeight: 200,
            backgroundColor: '#000',
          } as React.CSSProperties}
        />
        {showEdgeOverlay && <EdgeOverlay edgeImageData={edgeData} opacity={0.5} />}
        {grid && frameSize.width > 0 && (
          <GridOverlay
            grid={grid}
            sourceWidth={frameSize.width}
            sourceHeight={frameSize.height}
          />
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.controls}>
        <Pressable
          style={[styles.captureButton, captureActive && styles.captureButtonActive]}
          onPress={handleToggleCapture}
        >
          <Text style={styles.captureButtonText}>
            {captureActive ? 'Stop Vision' : 'Start Vision'}
          </Text>
        </Pressable>
        {processTimeMs !== null && (
          <Text style={styles.stats}>{processTimeMs.toFixed(0)}ms</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
  },
  error: {
    color: '#e74c3c',
    padding: 8,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captureButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  captureButtonActive: {
    backgroundColor: '#27ae60',
  },
  captureButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  stats: {
    color: '#aaa',
    fontSize: 12,
  },
});
