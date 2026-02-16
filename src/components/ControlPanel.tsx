import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ControlPanelProps {
  isPlaying: boolean;
  octave: number;
  bpm: number;
  onPlayToggle: () => void;
  onOctaveChange: (delta: number) => void;
  onBpmChange: (delta: number) => void;
  disabled?: boolean;
}

/**
 * Control panel for the step sequencer.
 * Play/Stop, Octave (2-6), BPM (60-200)
 */
export function ControlPanel({
  isPlaying,
  octave,
  bpm,
  onPlayToggle,
  onOctaveChange,
  onBpmChange,
  disabled = false,
}: ControlPanelProps) {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <Pressable
        style={[styles.button, isPlaying && styles.buttonActive]}
        onPress={onPlayToggle}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>{isPlaying ? 'Stop' : 'Start'}</Text>
      </Pressable>

      <View style={styles.row}>
        <View style={styles.control}>
          <Text style={styles.label}>Octave</Text>
          <View style={styles.controlRow}>
            <Pressable
              style={styles.smallButton}
              onPress={() => onOctaveChange(-1)}
              disabled={disabled || octave <= 2}
            >
              <Text style={styles.smallButtonText}>−</Text>
            </Pressable>
            <Text style={styles.value}>{octave}</Text>
            <Pressable
              style={styles.smallButton}
              onPress={() => onOctaveChange(1)}
              disabled={disabled || octave >= 6}
            >
              <Text style={styles.smallButtonText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.control}>
          <Text style={styles.label}>BPM</Text>
          <View style={styles.controlRow}>
            <Pressable
              style={styles.smallButton}
              onPress={() => onBpmChange(-10)}
              disabled={disabled || bpm <= 60}
            >
              <Text style={styles.smallButtonText}>−</Text>
            </Pressable>
            <Text style={styles.value}>{bpm}</Text>
            <Pressable
              style={styles.smallButton}
              onPress={() => onBpmChange(10)}
              disabled={disabled || bpm >= 200}
            >
              <Text style={styles.smallButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    paddingBottom: 24,
  },
  disabled: {
    opacity: 0.6,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonActive: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 24,
  },
  control: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 6,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallButton: {
    backgroundColor: '#444',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'center',
  },
});
