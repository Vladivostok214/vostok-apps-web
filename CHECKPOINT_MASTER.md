# CHECKPOINT_MASTER — Vostok Labs
> Documento de referencia para agentes. Contiene el contexto global de la aplicación, los estándares técnicos vigentes y el historial de milestones. Actualizado al: **2026-08-08**.

---

## 🧭 Contexto Global de la Aplicación

### ¿Qué es Vostok Labs?
**Vostok Labs** es un laboratorio de audio digital de grado profesional, diseñado para correr en navegadores web y dispositivos móviles. Su objetivo es brindar herramientas de medición y análisis acústico de precisión científica, con la misma calidad que se esperaría de software nativo de escritorio para ingeniería de sonido.

- **URL de producción:** https://vostok-apps-web.vercel.app/
- **Repositorio:** https://github.com/Vladivostok214/vostok-apps-web
- **Deploy:** Vercel (Web/PWA) + Capacitor (Android nativo)

### Filosofía de diseño
La aplicación se rige por tres pilares fundamentales:

| Pilar | Descripción |
|---|---|
| **Integridad Científica** | Captura audio raw del hardware, bypaseando el procesamiento del OS (Noise Suppression, AGC). Sin coloración artificial. |
| **Excelencia en Ingeniería** | JavaScript "near-the-metal": operaciones bitwise, zero-copy buffers, AudioWorklets en hilo separado. |
| **Diseño Noir-Tech** | Estética Cyber-Glassmorphism. Alto contraste, CRT-inspired, GPU-acelerada. 60 FPS en mobile. |

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework UI** | React 19 + Vite 8 |
| **Estilos** | Tailwind CSS 4.0 |
| **Audio Engine** | Web Audio API + AudioWorklets |
| **Animaciones** | Framer Motion (GPU acelerado) |
| **Iconografía** | Lucide React |
| **Persistencia local** | Dexie (IndexedDB) + localStorage |
| **Mobile** | Capacitor 8 (Android) |
| **Deploy Web** | Vercel (PWA) |

---

## 🛠️ La Suite de Herramientas

Cada herramienta es un módulo standalone con su propio motor DSP. Todos comparten la misma entrada de audio global (ver Arquitectura de Audio).

### 🛰️ Vostok Tuner — `Tuner.jsx`
Afinador de precisión profesional.
- **Algoritmo:** YIN Autocorrelation con interpolación parabólica sub-cent.
- **AOP Protection:** Descarta frames durante clipping digital para evitar detección de falsos armónicos.
- **Smoothing:** Suavizado exponencial fijo al 100% para aguja orgánica sin jitter.
- **Instrumentos:** Guitarra, Bajo, Violín, Ukulele y variantes de afinación (Standard, Drop D, DADGAD, etc.).
- **Haptics:** Vibración de 10ms al alcanzar 0 cents de desviación.

### 🌊 Spectrum Analyzer — `SpectrumAnalyzer.jsx`
Analizador de espectro en tiempo real (RTA).
- **Motor:** FFT de 4096 puntos.
- **Renderizado:** WebGL shaders para mapping espectral a 60 FPS.
- **Escala:** Logarítmica 20 Hz – 20 kHz con renderizado "Sonic Topography" (waterfall).
- **Control Response:** Rango 50 ms (rápido) → 5000 ms (lento), alineado con estándar Waves PAZ Analyzer.

### 🎙️ SPL Meter — `SPLMeter.jsx`
Sonómetro científico.
- **Estándar:** ISO 1996 compliant.
- **Ponderación:** A-Weighting (dBA) en tiempo real con filtros IIR de alta precisión.
- **Procesamiento:** AudioWorklet en hilo separado para precisión temporal y sin jitter de UI.

### ⏱️ TempoSense — `TempoSense.jsx`
Detector de BPM y tonalidad.
- **BPM:** Motor dual con HPS (Harmonic Product Spectrum) + suavizado Viterbi/HMM.
- **Tonalidad:** Extracción de chroma vectors optimizada para estabilidad armónica.
- **AOP Protection:** Descarte de frames por clipping para integridad armónica en Key Detection.

### 📡 Harmonic Radar — `HarmonicRadar.jsx`
Visualizador de armónicos y frecuencia de referencia.
- **Referencia afinada:** Selector de frecuencia de referencia via fader horizontal (ej: A4 = 432 Hz / 440 Hz / 443 Hz).
- **Visualización:** Radar polar de relaciones armónicas.

### ⚡ Impulse Response — `ImpulseResponse.jsx`
Medición de respuesta al impulso de espacios acústicos.

### 🎵 Scale Sensor — `ScaleSensor.jsx`
Detección de escala musical en tiempo real.

---

## 🔌 Arquitectura de Audio Global

### `AudioDeviceContext` — `src/context/AudioDeviceContext.jsx`
Context de React que gestiona la selección de dispositivo e I/O de forma global para toda la app.

```js
// Estado persistido en localStorage:
vostok_audio_device_id  // ID del dispositivo de entrada seleccionado
vostok_audio_channel    // Canal: 'mix' | '0' (Left) | '1' (Right)
```

**Función clave: `routeAudioChannel(audioCtx, sourceNode, selectedChannel)`**
- Usa `ChannelSplitterNode` para aislar el canal L o R de una interfaz estéreo.
- En modo `'mix'` devuelve el nodo original (downmix automático del navegador).
- Fallback seguro a canal 0 si la interfaz es estrictamente mono.

### `AudioSettingsModal` — `src/components/AudioSettingsModal.jsx`
Modal de configuración I/O accesible desde el botón **"I/O"** global en la UI.
- Selección de dispositivo de entrada (micrófono / interfaz de audio).
- Selección de canal: Mix, Canal L (0), Canal R (1).
- La configuración aplica simultáneamente a **todas las herramientas**.

---

## 🔒 Protocolo VHRP (Vostok Hardware Release Protocol)

Ciclo de vida de limpieza obligatorio en todos los componentes de audio:

1. **Cierre inmediato** del `AudioContext` al desmontar el componente.
2. **Liberación de tracks** — `MediaStream.getTracks().forEach(t => t.stop())`.
3. **Liberación de WakeLock** — para preservar batería en mobile.

> ⚠️ **Para agentes:** Todo componente nuevo que use audio DEBE implementar VHRP en su `useEffect` cleanup. No hacerlo provoca leaks de hardware que bloquean el micrófono entre navegaciones.

---

## 🎨 Sistema de Diseño

- **Filosofía:** Noir-Tech / Cyber-Glassmorphism.
- **Fuentes:** Tipografías modernas (Google Fonts).
- **Colores:** Paletas HSL curadas, dark mode nativo. Sin colores planos genéricos.
- **Animaciones:** Micro-animaciones con `framer-motion`. Hover effects, transiciones suaves.
- **Target de rendimiento:** 60 FPS en dispositivos móviles de gama media.
- **Responsive:** Desktop + Mobile. Los componentes deben adaptarse a ambos contexts.

---

## 📋 Estándares DSP (vigentes desde v1.4.0)

```js
// ✅ Latencia interactiva (mínimo buffer de hardware)
new AudioContext({ latencyHint: 'interactive' })

// ✅ Operaciones bitwise (bypass de floating-point en V8/JSCore)
const intVal = floatVal | 0;
const halfVal = intVal >> 1;

// ✅ Zero-allocation loops (reusar buffers, sin GC jitter)
const buf = new Float32Array(4096); // hoisted, reutilizado
```

---

## 📦 Componentes Secundarios

| Archivo | Rol |
|---|---|
| `AudioArchive.jsx` | Biblioteca de grabaciones del usuario (Dexie/IndexedDB) |
| `ExperimentBlog.jsx` | Blog de experimentos y notas técnicas |
| `VostokAdmin.jsx` | Panel de administración interno |
| `VostokIdentity.jsx` | Identidad/branding de la app |
| `InfoModal.jsx` | Modal de información y onboarding |
| `DiagnosticConsole.jsx` | Consola de diagnóstico técnico |
| `Footer.jsx` | Footer global |

---
---

# 📍 Historial de Milestones

---

## Milestone v1.4.0 — DSP Performance & MEMS Optimization
**Fecha:** 2026-05-18 | **Status:** ✅ COMPLETADO

Todas las herramientas fueron actualizadas con lógica DSP de alto rendimiento específicamente optimizada para hardware móvil y micrófonos MEMS.

### Cambios implementados:
- **Tuner:** Motor YIN con optimización bitwise + detección AOP (Acoustic Overload Point) para prevenir falsos armónicos en clipping digital.
- **Spectrum Analyzer:** Loop de waterfall optimizado con truncación bitwise + monitoreo de sobrecarga en tiempo real.
- **SPL Meter:** Estandarización de latencia interactiva + preparación para alertas visuales de OVERLOAD.
- **TempoSense:** Protección AOP en Key Detection con descarte de frames.

### Estándares técnicos establecidos:
- `latencyHint: 'interactive'` forzado en toda la suite.
- Motor DSP bitwise (`>>`, `<<`, `| 0`) para bypass de overhead floating-point.
- Loops Zero-Allocation con hoisting de variables, minimizando GC jitter.
- **Protocolo VHRP** activo y verificado en todos los paths de navegación.

---

## Milestone v1.5.0 — Global I/O Routing & UX Refinement
**Fecha:** 2026-08-08 | **Status:** ✅ DESPLEGADO EN PRODUCCIÓN

Foco en experiencia de usuario, ruteo global de I/O de audio e integración con interfaces de audio externas.

### 🔌 1. Selector I/O General
**Archivos modificados:** `AudioDeviceContext.jsx`, `AudioSettingsModal.jsx`, `App.jsx`

- Implementado **selector manual de canal de entrada** para interfaces de audio externas. El usuario elige entre Mix, Canal L (0) o Canal R (1).
- Salida ruteada por defecto a las salidas 1 y 2 de la interfaz activa.
- El botón global de configuración cambió de ícono de engranaje genérico a **etiqueta "I/O"**, más técnicamente directa.
- Configuración **global**: aplica a todas las herramientas simultáneamente.
- Verificado funcionalmente con interfaz externa (Canal 2 probado manualmente ✅).

### 🎸 2. UX — Vostok Tuner
**Archivo modificado:** `Tuner.jsx`

- **Eliminado el panel de configuración derecho** (calibración + carga de archivo de calibración).
- **Smoothing fijado internamente al 100%**, sin control de usuario. Máxima estabilidad visual de la aguja.
- **Rediseño del selector de instrumento:**
  - Cada instrumento tiene ahora su botón visible directamente en el panel lateral.
  - Al presionar un instrumento se despliegan sus variantes de afinación.
  - Comportamiento toggle: volver a presionar el instrumento activo cierra el panel.
- Texto **"Seleccionar instrumento"** añadido al panel para orientar al usuario.
- **Fix responsive mobile:** Los nombres de notas del lado izquierdo mantienen la distancia correcta al tuner central en mobile (ya no se pegaban al borde).

### 📊 3. UX — Spectrum Analyzer
**Archivo modificado:** `SpectrumAnalyzer.jsx`

- **Nuevo control "Response"** reemplaza el botón play/pausa:
  - Controla cuánto tiempo permanece visible la energía espectral acumulada.
  - Rango: **50 ms** (respuesta rápida) → **5000 ms** (respuesta lenta, acumulación visible).
  - Nomenclatura alineada con estándar de industria: **Waves PAZ Analyzer**.
  - Diseño minimalista integrado en la UI superior.

### 📦 Commits & Deploy
- 2 commits pusheados a `Vladivostok214/vostok-apps-web`:
  - `feat: I/O selector + Tuner UX redesign`
  - `feat: Spectrum Response control (50–5000ms)`
- Desplegado en producción → https://vostok-apps-web.vercel.app/

---

*Vostok Labs: Engineering the Future of Sound.*
