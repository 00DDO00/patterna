import { StyleSheet, Text, View } from 'react-native';

import { CameraView } from './CameraView';
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
 * Native fallback: Basic camera view without frame capture.
 * Frame capture + vision pipeline is web-only for now.
 */
export function CameraWithFrames({ style }: CameraWithFramesProps) {
  return (
    <View style={[styles.container, style]}>
      <CameraView style={styles.camera} />
      <Text style={styles.note}>Frame capture available on web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  note: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});
