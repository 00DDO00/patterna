import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { Frame } from '../types';

const TARGET_WIDTH = 320;
const TARGET_HEIGHT = 240;
const TARGET_FPS = 15;

export interface UseCameraFramesOptions {
  /** Called with each captured frame (throttled to target FPS) */
  onFrame?: (frame: Frame) => void;
  /** Whether capture is active */
  active?: boolean;
  /** Container element to mount video/canvas into (web only) */
  containerRef?: React.RefObject<HTMLElement | null>;
}

export interface UseCameraFramesResult {
  /** Video stream is ready */
  ready: boolean;
  /** Error message if stream failed */
  error: string | null;
  /** Request permission and start stream */
  start: () => Promise<void>;
  /** Stop the stream */
  stop: () => void;
}

/**
 * Capture camera frames for web.
 * Creates video and canvas elements, captures frames at target FPS.
 */
export function useCameraFrames({
  onFrame,
  active = true,
  containerRef,
}: UseCameraFramesOptions = {}): UseCameraFramesResult {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const lastCaptureRef = useRef<number>(0);

  const start = useCallback(async () => {
    if (Platform.OS !== 'web') {
      setError('Frame capture only supported on web');
      return;
    }

    const container = containerRef?.current;
    if (!container) {
      setError('Container ref not ready');
      return;
    }

    try {
      setError(null);

      // Create video and canvas elements
      const video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.transform = 'scaleX(-1)';

      const canvas = document.createElement('canvas');
      canvas.style.display = 'none';

      container.appendChild(video);
      container.appendChild(canvas);

      videoRef.current = video;
      canvasRef.current = canvas;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: TARGET_WIDTH },
          height: { ideal: TARGET_HEIGHT },
          facingMode: 'environment',
        },
        audio: false,
      });

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      setReady(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera access failed';
      setError(msg);
      setReady(false);
      // Cleanup on error
      videoRef.current?.parentElement?.removeChild(videoRef.current);
      canvasRef.current?.parentElement?.removeChild(canvasRef.current);
    }
  }, [containerRef]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    if (videoRef.current?.parentElement) {
      videoRef.current.parentElement.removeChild(videoRef.current);
      videoRef.current = null;
    }
    if (canvasRef.current?.parentElement) {
      canvasRef.current.parentElement.removeChild(canvasRef.current);
      canvasRef.current = null;
    }
    setReady(false);
  }, []);

  // Capture loop
  useEffect(() => {
    if (Platform.OS !== 'web' || !active || !ready || !onFrame) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const minInterval = 1000 / TARGET_FPS;

    const capture = () => {
      if (!video.videoWidth) {
        rafRef.current = requestAnimationFrame(capture);
        return;
      }

      const now = performance.now();
      if (now - lastCaptureRef.current >= minInterval) {
        lastCaptureRef.current = now;

        const vw = video.videoWidth;
        const vh = video.videoHeight;

        canvas.width = Math.min(vw, TARGET_WIDTH);
        canvas.height = Math.min(vh, TARGET_HEIGHT);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        onFrame({
          data: imageData,
          width: canvas.width,
          height: canvas.height,
          timestamp: now,
        });
      }

      rafRef.current = requestAnimationFrame(capture);
    };

    rafRef.current = requestAnimationFrame(capture);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [active, ready, onFrame]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { ready, error, start, stop };
}
