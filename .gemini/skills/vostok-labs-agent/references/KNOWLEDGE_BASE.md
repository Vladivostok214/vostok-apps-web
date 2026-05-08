# Vostok Labs Technical Knowledge Base

## Technical Architecture
- **Frameworks:** React, Vite, TailwindCSS.
- **Mobile Deployment:** Capacitor.
- **Core Engine:** Custom Audio processing (Zero-Copy implementation).
- **Data Flow:** `requestAnimationFrame` loops (60 FPS) with manual buffer management.

## Scientific Standards
### 1. Vostok Tuner
- Engine: Auto-correlation with hardware wake-lock.
- High-fidelity haptic feedback (10ms vibration on tune).

### 2. Spectrum Analyzer (HD-RTA)
- Resolution: 4096 FFT points.
- 1/f NRC (Noise/Response Compensation) filter.
- Room Mode detection via spectral persistence tracking.
- Sonic Topography (3D Waterfall) with relay shading.

### 3. SPL Meter
- ISO 1996 compliant A-Weighting (dBA).
- NIOSH-standard risk tracking (85dB/8h).

### 4. TempoSense
- Chroma vector analysis for real-time key detection.

## Engineering Standards
- Persistent Buffer reuse (`Float32Array`).
- Hardware bypass for `getUserMedia` (raw audio).
- React state stabilization (`useRef` + `useCallback`).
