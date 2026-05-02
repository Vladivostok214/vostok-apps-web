# Vostok Labs | Digital Audio Redefined

Vostok Labs is a high-fidelity digital audio laboratory featuring a studio-grade interactive tuner and an immersive web ecosystem. Built with a "Mobile-First, Performance-Always" philosophy, this project demonstrates how to bridge the gap between web applications and native experiences using modern engineering techniques.

---

## 🚀 The Technical Journey & "Vibecode" Workflow

The perfection of Vostok Labs was achieved through a collaborative iterative process between the developer and AI agents (Vibecode). This workflow focused on transforming a visual prototype into a production-ready tool.

### 1. The Performance Pivot (Audio Engine)
Early versions used standard JavaScript arrays for signal processing, leading to significant Garbage Collection (GC) overhead and visual stuttering.
*   **The Decision:** Shifted to **Zero-Copy Processing**.
*   **The Implementation:** Pre-allocated `Float32Array` buffers and `subarray` methods were implemented to handle 2048-sample windows at 60 FPS without memory reallocation.

### 2. Mobile-Native Parity
To ensure the app feels identical on a browser and as an installed app:
*   **Safe Area Integration:** Implemented `viewport-fit=cover` and CSS env variables to handle modern device notches.
*   **Haptic Engine:** Integrated the Vibration API to provide tactical feedback upon reaching perfect pitch.
*   **Screen Wake Lock:** Added logic to prevent mobile devices from sleeping during active tuning sessions.

### 3. Visual Depth vs. Performance
The "Vostok Aesthetic" relies on deep glows and layers. Standard CSS `blur` filters proved too heavy for mobile GPUs.
*   **The Decision:** Optimized rendering using **Radial Gradients** with hardware acceleration (`will-change: transform`). This restored the sensation of depth while maintaining battery efficiency.

---

## 🛠 Tech Stack

*   **Framework:** React 19 + Vite
*   **Animations:** Framer Motion (GPU Accelerated)
*   **Styling:** Tailwind CSS 4.0 + Custom Radial Shaders
*   **Audio:** Web Audio API (Auto-correlation Algorithm)
*   **Platform:** PWA (Progressive Web App) + Capacitor support for Android

---

## 📖 Guiding Principles for Similar Projects

1.  **Memory Management is King:** In audio or real-time apps, avoid `new Array()` or `.slice()` inside `requestAnimationFrame`. Use TypedArrays.
2.  **Touch First, Hover Second:** Replace `:hover` states with `active:scale` for instant mobile feedback.
3.  **The "Install" UX:** Don't wait for users to find the download button. Implement a custom PWA install prompt for better conversion.

---
---

# Vostok Labs | El Audio Digital Redefinido (Versión Español)

Vostok Labs es un laboratorio de audio digital de alta fidelidad que cuenta con un afinador interactivo de grado de estudio y un ecosistema web inmersivo. Construido con la filosofía de "Móvil Primero, Rendimiento Siempre", este proyecto demuestra cómo cerrar la brecha entre las aplicaciones web y las experiencias nativas.

---

## 🚀 El Viaje Técnico y Flujo de Trabajo "Vibecode"

El perfeccionamiento de Vostok Labs se logró mediante un proceso iterativo colaborativo entre el desarrollador y agentes de IA (Vibecode). Este flujo se centró en transformar un prototipo visual en una herramienta lista para producción.

### 1. El Pivote de Rendimiento (Motor de Audio)
Las versiones iniciales usaban arrays estándar de JavaScript para el procesamiento de señales, lo que generaba una sobrecarga significativa en el recolector de basura (GC) y tirones visuales.
*   **La Decisión:** Cambio a **Procesamiento Zero-Copy**.
*   **La Implementación:** Se implementaron buffers `Float32Array` pre-asignados y métodos `subarray` para manejar ventanas de 2048 muestras a 60 FPS sin reasignación de memoria.

### 2. Paridad Nativa en Móviles
Para asegurar que la app se sienta idéntica en el navegador y como app instalada:
*   **Integración de Safe Areas:** Implementación de `viewport-fit=cover` y variables de entorno CSS para manejar los notches de dispositivos modernos.
*   **Motor Háptico:** Integración de la API de Vibración para dar feedback táctil al alcanzar la afinación perfecta.
*   **Screen Wake Lock:** Lógica añadida para evitar que los dispositivos móviles entren en suspensión durante las sesiones de afinación activas.

### 3. Profundidad Visual vs. Rendimiento
La estética "Vostok" depende de brillos profundos y capas. Los filtros `blur` estándar de CSS resultaron pesados para las GPUs móviles.
*   **La Decisión:** Optimización del renderizado mediante **Gradientes Radiales** con aceleración por hardware. Esto restauró la profundidad manteniendo la eficiencia de la batería.

---

## 🛠 Stack Tecnológico

*   **Framework:** React 19 + Vite
*   **Animaciones:** Framer Motion (Aceleradas por GPU)
*   **Estilo:** Tailwind CSS 4.0 + Shaders Radiales Personalizados
*   **Audio:** Web Audio API (Algoritmo de Auto-correlación)
*   **Plataforma:** PWA (Progressive Web App) + Soporte Capacitor para Android
