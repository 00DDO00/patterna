import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import { useCallback } from 'react';

interface CameraViewProps {
  style?: object;
}

/**
 * Camera view component with permission handling.
 * Renders camera feed for Phase 0; frame processing will be added in Phase 2.
 */
export function CameraView({ style }: CameraViewProps) {
  const [permission, requestPermission] = useCameraPermissions();

  const handleRequestPermission = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered, style]}>
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, style]}>
        <Text style={styles.text}>Camera access is required for pattern detection.</Text>
        <Pressable onPress={handleRequestPermission}>
          <Text style={[styles.text, styles.button]}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ExpoCameraView style={styles.camera} facing="back" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    color: '#007AFF',
    fontWeight: '600',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
});
