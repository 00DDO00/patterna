import { useCallback, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { CameraView } from './src/components/CameraView';
import { ControlPanel } from './src/components/ControlPanel';
import { AudioEngine } from './src/services/AudioEngine';
import { DEMO_SEQUENCE } from './src/utils/sampleSequences';

/**
 * Pattern-to-Music Step Sequencer
 * Phase 0: Camera view with permissions
 * Phase 1: Standalone audio engine with demo sequence
 */
export default function App() {
  const audioEngineRef = useRef(new AudioEngine());
  const [isPlaying, setIsPlaying] = useState(false);
  const [octave, setOctave] = useState(4);
  const [bpm, setBpm] = useState(120);

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
        engine.updateSequence(DEMO_SEQUENCE);
      }

      engine.setOctave(octave);
      engine.setBpm(bpm);
      engine.updateSequence(DEMO_SEQUENCE); // Re-apply with current octave
      engine.start();
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to start audio:', err);
    }
  }, [isPlaying, octave, bpm]);

  const handleOctaveChange = useCallback((delta: number) => {
    setOctave((prev) => {
      const next = Math.max(2, Math.min(6, prev + delta));
      audioEngineRef.current.setOctave(next);
      if (audioEngineRef.current.initialized) {
        audioEngineRef.current.updateSequence(DEMO_SEQUENCE);
      }
      return next;
    });
  }, []);

  const handleBpmChange = useCallback((delta: number) => {
    setBpm((prev) => {
      const next = Math.max(60, Math.min(200, prev + delta));
      audioEngineRef.current.setBpm(next);
      return next;
    });
  }, []);

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} />
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
