import { useCallback, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { CameraWithFrames } from './src/components/CameraWithFrames';
import { ControlPanel } from './src/components/ControlPanel';
import { AudioEngine } from './src/services/AudioEngine';
import { DEMO_SEQUENCE } from './src/utils/sampleSequences';
import type { NoteSequence } from './src/types';

/**
 * Pattern-to-Music Step Sequencer
 * Phases 0-4: Camera → Vision → Grid → Mapping → Audio
 */
export default function App() {
  const audioEngineRef = useRef(new AudioEngine());
  const [isPlaying, setIsPlaying] = useState(false);
  const [octave, setOctave] = useState(4);
  const [bpm, setBpm] = useState(120);
  const [visionActive, setVisionActive] = useState(false);
  const visionSequenceRef = useRef<NoteSequence | null>(null);

  const getCurrentSequence = useCallback(() => {
    return visionActive && visionSequenceRef.current
      ? visionSequenceRef.current
      : DEMO_SEQUENCE;
  }, [visionActive]);

  const handleProcessedFrame = useCallback((result: { noteSequence: NoteSequence | null }) => {
    if (result.noteSequence) {
      visionSequenceRef.current = result.noteSequence;
      if (audioEngineRef.current.initialized && audioEngineRef.current.isPlaying) {
        audioEngineRef.current.updateSequence(result.noteSequence);
      }
    }
  }, []);

  const handlePlayToggle = useCallback(async () => {
    const engine = audioEngineRef.current;

    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      return;
    }

    try {
      if (!engine.initialized) {
        await engine.init();
      }

      engine.setOctave(octave);
      engine.setBpm(bpm);
      engine.updateSequence(getCurrentSequence());
      engine.start();
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to start audio:', err);
    }
  }, [isPlaying, octave, bpm, getCurrentSequence]);

  const handleOctaveChange = useCallback((delta: number) => {
    setOctave((prev) => {
      const next = Math.max(2, Math.min(6, prev + delta));
      audioEngineRef.current.setOctave(next);
      if (audioEngineRef.current.initialized) {
        audioEngineRef.current.updateSequence(getCurrentSequence());
      }
      return next;
    });
  }, [getCurrentSequence]);

  const handleBpmChange = useCallback((delta: number) => {
    setBpm((prev) => {
      const next = Math.max(60, Math.min(200, prev + delta));
      audioEngineRef.current.setBpm(next);
      return next;
    });
  }, []);

  return (
    <View style={styles.container}>
      <CameraWithFrames
        style={styles.camera}
        showEdgeOverlay
        onProcessedFrame={handleProcessedFrame}
        onVisionActiveChange={setVisionActive}
      />
      <ControlPanel
        isPlaying={isPlaying}
        octave={octave}
        bpm={bpm}
        onPlayToggle={handlePlayToggle}
        onOctaveChange={handleOctaveChange}
        onBpmChange={handleBpmChange}
      />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  camera: {
    flex: 1,
  },
});
