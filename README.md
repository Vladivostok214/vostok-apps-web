# Vostok Labs: High-Fidelity Digital Audio Ecosystem (v1.4.0)

**Vostok Labs** is a professional-grade digital audio laboratory designed for the web and mobile devices. It bridges the gap between scientific measurement tools and creative musical interfaces, prioritizing **low-latency performance**, **scientific accuracy**, and a **Noir-Tech aesthetic**.

The ecosystem is built to operate under extreme hardware constraints, specifically optimized for **MEMS (Micro-Electro-Mechanical Systems)** microphones found in modern smartphones.

---

## 1. Core Purpose & Philosophy

Vostok Labs serves as a high-performance suite for musicians, sound engineers, and acoustic researchers. Our philosophy is rooted in three pillars:
*   **Scientific Integrity:** Bypassing OS-level audio processing (Noise Suppression, AGC) to capture raw, linear signals.
*   **Engineering Excellence:** Implementing "Near-the-Metal" JavaScript using bitwise operations and zero-copy memory management.
*   **Noir-Tech Design:** A high-contrast, CRT-inspired interface that reduces eye strain in laboratory or studio environments while utilizing GPU-accelerated rendering.

---

## 2. The Modular Suite: Technical Deep-Dive

Each tool in the Vostok suite is a standalone module with dedicated DSP engines.

### 🛰️ Vostok Tuner (Precision Pitch)
*   **Algorithm:** Uses the **YIN Autocorrelation Algorithm** for stable pitch estimation.
*   **DSP Features:** Parabolic interpolation for sub-cent precision and a bitwise-optimized inner loop.
*   **AOP Protection:** Silently discards frames during digital clipping to prevent false harmonic detection.
*   **Haptics:** Millimetric vibration (10ms) triggered upon 0-cent deviation.

### 🌊 Spectrum Analyzer (HD-RTA)
*   **Engine:** 4096-point FFT (Fast Fourier Transform).
*   **Rendering:** **WebGL-powered shaders** for 60FPS spectral mapping.
*   **Mapping:** Logarithmic frequency scaling (20Hz - 20kHz) with custom "Sonic Topography" (Waterfall) rendering.
*   **Optimization:** Bitwise truncation for real-time waterfall buffer processing.

### 🎙️ SPL Meter (Scientific Sound Level)
*   **Standards:** ISO 1996 compliant.
*   **Weighting:** Real-time **A-Weighting (dBA)** filters implemented via high-precision IIR coefficients.
*   **AudioWorklet:** Heavy lifting performed in a separate thread to ensure timing accuracy and prevent UI-induced jitter.

### ⏱️ TempoSense (BPM & Key)
*   **Analysis:** Dual-engine approach using **HPS (Harmonic Product Spectrum)** for fundamental isolation and **Viterbi/HMM (Hidden Markov Model)** for temporal smoothing.
*   **Key Detection:** Chroma vector extraction optimized for harmonic stability.
*   **Tap Tempo:** Low-latency event listener with jitter rejection logic.

---

## 3. Engineering Standards (Standardized v1.4.0)

To achieve professional-grade results in the browser, Vostok Labs enforces the following technical protocols:

### Vostok Hardware Release Protocol (VHRP)
A mandatory cleanup lifecycle for all tools to ensure **Zero-Leak** performance:
1.  **Immediate Closure:** Absolute destruction of `AudioContext` on unmount.
2.  **Track Release:** Explicitly stopping `MediaStream` (Microphone) tracks to release system-level locks.
3.  **WakeLock Management:** Releasing screen-stay-awake locks to preserve battery.

### High-Performance DSP Standards
*   **Bitwise Optimization:** Mathematical operations use `>>`, `<<`, and `| 0` to bypass floating-point overhead in JS engines (V8/JavaScriptCore).
*   **Zero-Copy Logic:** Reusing `Float32Array` buffers via `subarray()` methods to eliminate Garbage Collection (GC) jitter.
*   **Interactive Latency:** Forcing `latencyHint: 'interactive'` to request the smallest possible hardware buffers from the OS.

---

## 4. Technical Stack
*   **Core:** React 19, Vite, Tailwind CSS 4.0.
*   **Audio Engine:** Web Audio API, AudioWorklets.
*   **Animation:** Framer Motion (GPU Accelerated).
*   **Deployment:** Capacitor (Mobile), Vercel (Web/PWA).

---

# Vostok Labs: Ecosistema de Audio Digital de Alta Fidelidad (v1.4.0)

**Vostok Labs** es un laboratorio de audio digital de grado profesional diseñado para la web y dispositivos móviles. Elimina la brecha entre las herramientas de medición científica y las interfaces musicales creativas, priorizando el **rendimiento de baja latencia**, la **precisión científica** y una **estética Noir-Tech**.

## 1. Propósito y Filosofía
Vostok Labs sirve como una suite de alto rendimiento para músicos e ingenieros. Nuestra filosofía se basa en la **Integridad Científica** (captura de audio raw), **Excelencia en Ingeniería** (procesamiento de bajo nivel) y **Diseño Noir-Tech** (interfaces de alto contraste inspiradas en laboratorios).

## 2. La Suite Modular: Detalle Técnico
*   **Vostok Tuner:** Algoritmo YIN con interpolación parabólica y protección AOP (Acoustic Overload Point).
*   **Spectrum Analyzer:** RTA de 4096 puntos FFT con renderizado WebGL y Topografía Sónica.
*   **SPL Meter:** Sonómetro dBA conforme a ISO 1996 usando AudioWorklets para precisión temporal.
*   **TempoSense:** Análisis de tonalidad mediante HPS y suavizado Viterbi (HMM).

## 3. Estándares de Ingeniería
*   **Protocolo VHRP:** Limpieza absoluta de hardware al desmontar componentes (AudioContext, Micrófono, WakeLock).
*   **Optimización Bitwise:** Uso de operaciones a nivel de bits para máxima eficiencia en CPUs móviles.
*   **Latencia Interactiva:** Configuración de buffers mínimos para respuesta visual instantánea.

---
*Vostok Labs: Engineering the Future of Sound.*
