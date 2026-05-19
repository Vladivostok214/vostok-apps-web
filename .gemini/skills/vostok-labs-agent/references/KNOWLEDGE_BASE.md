# Vostok Labs Technical Knowledge Base

## Technical Architecture
- **Frameworks:** React, Vite, TailwindCSS.
- **Mobile Deployment:** Capacitor.
- **Core Engine:** Custom Audio processing (Zero-Copy implementation).
- **Data Flow:** `requestAnimationFrame` loops (60 FPS) with manual buffer management.

## Engineering Standards (v1.4.0 Optimized)
- **VHRP Protocol:** Mandatory Hardware Release Protocol. Absolute cleanup of `AudioContext`, `MediaStream`, and `WakeLock` on unmount.
- **Bitwise DSP Engine:** Mathematical operations moved to bit-level (`>>`, `<<`, `| 0`) to bypass floating-point overhead in V8/JSCore.
- **AOP Management (Silent):** Acoustic Overload Point detection implemented to handle MEMS microphone clipping. Protection must be handled at the DSP level (frame discarding or internal limiting) without triggering visual UI alerts or interruptions. The Noir-Tech experience must remain smooth and cohesive.
- **DSP-HEALTH:** Always disable hardware processing (`echoCancellation`, `noiseSuppression`, `autoGainControl`) for scientific measurements.
- **Low-Latency:** Force `latencyHint: 'interactive'` for minimal hardware buffers.

## Scientific Standards
### 1. Vostok Tuner
- Engine: Auto-correlation (YIN) with parabolic interpolation and AOP protection.
- High-fidelity haptic feedback (10ms vibration on tune).

### 2. Spectrum Analyzer (HD-RTA)
- Resolution: 4096 FFT points.
- WebGL rendering with Bitwise Waterfall processing.
- Room Mode detection via spectral persistence tracking.

### 3. SPL Meter
- ISO 1996 compliant A-Weighting (dBA).
- MEMS-clipping "OVERLOAD" visual indicator support.

### 4. TempoSense
- HPS + Viterbi (HMM) engine with frame-discarding AOP protection.
