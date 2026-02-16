# Pattern-to-Music Step Sequencer

Point your camera at patterned surfaces (bricks, tiles) and hear them as music in real-time.

## Phase 0 ✅ — Environment & Scaffolding

- [x] Expo + React Native + TypeScript
- [x] Project structure (`src/components`, `services`, `utils`, `types`)
- [x] Core types (`Frame`, `Grid`, `Cell`, `NoteSequence`)
- [x] Camera view with permission handling

## Phase 1 ✅ — Audio Engine

- [x] 16-step sequencer with Tone.js
- [x] PolySynth with pentatonic demo sequence
- [x] Play/Stop, Octave (2–6), BPM (60–200) controls
- [x] Cross-platform audio via react-native-audio-api

## Phase 2 ✅ — Vision Pipeline (Web)

- [x] Frame capture from camera (web: getUserMedia + canvas)
- [x] Grayscale conversion
- [x] Sobel edge detection
- [x] Edge overlay with processing time display
- [x] “Start Vision” / “Stop Vision” toggle

## Phase 3 ✅ — Grid Detection

- [x] Line detection via projection (horizontal/vertical peaks)
- [x] Grid extraction from line intersections
- [x] Grid overlay (green wireframe)
- [x] Grid caching for stability

## Phase 4 ✅ — Mapping Engine

- [x] Cell sampling (center region, RGB + brightness)
- [x] Color clustering → pentatonic notes (C, D, E, G, A)
- [x] Brightness threshold for active notes
- [x] Pattern → NoteSequence pipeline
- [x] Wired to audio when vision + play active

## Run the app

```bash
cd pattern-to-music
npm start
```

- **Web:** Press `w` or run `npm run web` — best for Phase 1 audio testing
- **iOS/Android:** Press `i` or `a`, or scan QR with Expo Go (camera works; audio needs dev build for full support)

> **Note:** Audio uses react-native-audio-api. For native (iOS/Android) audio, use `npx expo run:ios` or `npx expo run:android` (development build). Expo Go may have limited audio support.

## Project structure

```
pattern-to-music/
├── src/
│   ├── components/    # CameraView, ControlPanel, GridOverlay (Phase 2+)
│   ├── services/      # AudioEngine, VisionService, MotionController
│   ├── utils/         # sampleSequences, colorUtils, gridUtils, noteMapping
│   └── types/         # Frame, Grid, Cell, NoteSequence
├── App.tsx
└── package.json
```

## Next: Phase 5–6

Phase 5: Full integration polish. Phase 6: Motion control (tilt → octave).
