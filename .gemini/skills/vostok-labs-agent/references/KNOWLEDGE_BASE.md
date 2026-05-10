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
- **DSP-HEALTH:** Always disable hardware processing (`echoCancellation`, `noiseSuppression`, `autoGainControl`) for scientific measurements (SPL, RTA). Mobile DSP is optimized for speech and destroys signal linearity.
- **UX-STABILITY:** Implement dual-layer navigation. Use `@capacitor/app` for native hardware back-button and `history.pushState` + `popstate` for PWA/Browser sub-view management to prevent accidental app exits.
- **Zero-Copy Performance:** Persistent Buffer reuse (`Float32Array`) in animation loops to avoid GC pressure.
- **State Integrity:** Use `useRef` to mirror critical state (like `currentView`) inside async listeners to prevent stale closures.
