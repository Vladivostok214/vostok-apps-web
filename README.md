# Vostok Labs: Engineering High-Fidelity Digital Audio (v1.4.0)

Vostok Labs is a high-performance digital audio laboratory and ecosystem. This project implements a suite of studio-grade tools (Tuner, Spectrum, SPL, TempoSense), bridging the gap between web-based tools and native hardware experiences through advanced signal processing and optimized rendering techniques.

## Technical Architecture (v1.4.0 MEMS Optimized)

The Vostok Labs ecosystem has evolved into a modular suite focused on three core pillars: performance, mobile hardware parity, and scientific integrity.

### 1. Advanced DSP & Bitwise Optimization
To maximize CPU efficiency on mobile devices, the audio engine has transitioned to low-level mathematical operations.
*   **Bitwise DSP:** All integer calculations (downsampling, buffer indexing) utilize bitwise operators (`>>`, `<<`, `| 0`), bypassing floating-point overhead in V8/JSCore engines.
*   **Zero-Copy Processing:** Leverages `Float32Array` pre-allocated buffers and `subarray` methods to eliminate Garbage Collection (GC) jitter.

### 2. MEMS Microphone Integration & AOP
Mobile MEMS microphones have specific characteristics handled by the **Vostok Hardware Release Protocol (VHRP)**:
*   **AOP Management (Silent):** Real-time **Acoustic Overload Point** detection. Digital clipping is handled at the DSP level (frame discarding or internal limiting) to maintain a smooth UI while protecting scientific accuracy.
*   **Interactive Latency:** Enforced `latencyHint: 'interactive'` to request minimal hardware buffer sizes from iOS/Android.
*   **Hardware Cleanup (VHRP):** Absolute resource release (AudioContext, MediaStream tracks, WakeLock) on component unmount to prevent battery drain or camera/mic lock.

### 3. Modular Suite & Visual Integrity
The project architecture has been refactored for scalability:
*   **Modularization:** Tools are isolated components (e.g., `Tuner.jsx`, `SpectrumAnalyzer.jsx`) for independent performance profiling.
*   **High-Res Spectrum:** WebGL-powered 4096 FFT RTA with optimized bitwise waterfall rendering.
*   **Noir-Tech Aesthetics:** CRT scanlines, glassmorphism, and hardware-accelerated shaders (`will-change`).

## Technical Stack
*   **Core:** React 19, Vite, Tailwind CSS 4.0
*   **Rendering:** WebGL (Spectrum), Framer Motion (GPU Accelerated UI)
*   **Audio Engine:** Web Audio API (YIN, HPS, Viterbi/HMM engines)
*   **Distribution:** Capacitor (Mobile), PWA (Standalone)

---

# Vostok Labs: Ingeniería de Audio Digital de Alta Fidelidad (v1.4.0)

Vostok Labs es un laboratorio y ecosistema de audio digital de alto rendimiento. Este proyecto implementa una suite de herramientas de grado de estudio (Afinador, Espectro, SPL, TempoSense), eliminando la brecha entre las aplicaciones web y las experiencias de hardware nativas mediante procesamiento avanzado y técnicas de renderizado optimizadas.

## Arquitectura Técnica (v1.4.0 Optimizado para MEMS)

El ecosistema de Vostok Labs ha evolucionado hacia una suite modular centrada en tres pilares: rendimiento, paridad con hardware móvil e integridad científica.

### 1. DSP Avanzado y Optimización Bitwise
Para maximizar la eficiencia de la CPU en dispositivos móviles, el motor de audio ha transicionado a operaciones matemáticas de bajo nivel.
*   **DSP Bitwise:** Todos los cálculos de enteros (downsampling, índices de buffer) utilizan operadores de bits (`>>`, `<<`, `| 0`), evitando la sobrecarga de punto flotante en motores V8/JSCore.
*   **Procesamiento Zero-Copy:** Uso de buffers `Float32Array` pre-asignados y métodos `subarray` para eliminar el jitter por Recolección de Basura (GC).

### 2. Integración de Micrófonos MEMS y AOP
Los micrófonos MEMS móviles poseen características específicas gestionadas por el **Protocolo de Liberación de Hardware (VHRP)**:
*   **Gestión de AOP (Silenciosa):** Detección en tiempo real del **Acoustic Overload Point**. El clipping digital se gestiona a nivel de DSP (descarte de frames o limitación interna) para mantener una interfaz fluida mientras se protege la precisión científica.
*   **Latencia Interactiva:** Aplicación de `latencyHint: 'interactive'` para exigir al sistema (iOS/Android) el tamaño de buffer más pequeño posible.
*   **VHRP (Limpieza de Hardware):** Liberación absoluta de recursos (AudioContext, MediaStream, WakeLock) al desmontar componentes para evitar drenaje de batería.

### 3. Suite Modular e Integridad Visual
La arquitectura del proyecto ha sido refactorizada para escalabilidad:
*   **Modularización:** Cada herramienta es un componente aislado (ej. `Tuner.jsx`, `SpectrumAnalyzer.jsx`) para perfilado de rendimiento independiente.
*   **Espectro de Alta Resolución:** RTA de 4096 puntos FFT con aceleración WebGL y renderizado de cascada (waterfall) optimizado por bits.
*   **Estética Noir-Tech:** Scanlines CRT, glassmorphism y shaders acelerados por hardware.
