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

## Milestone v1.6.0 — Premium Dashboard Cockpit & Technical Telemetry
**Fecha:** 2026-08-08 | **Status:** ✅ DESPLEGADO EN PRODUCCIÓN

Foco en la consolidación del sistema de diseño unificado, geometría de cabina envolvente de alto nivel y visualización de telemetría de precisión técnica en tiempo real.

### 🎛️ 1. Arquitectura de Cabina Envolvente (Crescent Cockpit)
- **Geometría en Medialuna:** Diseñamos una estructura arqueada en la vista de escritorio para las 7 herramientas modulares. Mediante desplazamientos progresivos en el eje horizontal (`baseX`), logramos que las columnas laterales abracen de manera orgánica el centro.
- **Alineación Centrípeta de Texto y Visor:** Reorientamos el orden de los textos y los visores según la columna para dirigir todos los gráficos hacia el centro:
  - *Rack Izquierdo:* Texto alineado a la derecha, seguido de la micro-pantalla a la derecha.
  - *Rack Derecho:* Micro-pantalla a la izquierda, seguida del texto alineado a la izquierda.
- **Acoplamiento Compacto de Etiquetas:** Eliminamos la propiedad `justify-between` de los botones y los agrupamos de manera compacta mediante un espacio estrecho de **`gap-3` (12px)**, logrando que los nombres de los instrumentos queden inmediatamente pegados a sus pantallas animadas.
- **Reajuste del Hero Central:** Redujimos un 5% la escala del texto principal del Hero (`Vostok Labs`) y lo desplazamos ligeramente hacia abajo en el eje vertical para equilibrar su centro de gravedad con la curvatura de las herramientas laterales.

### 🎚️ 2. Unificación Estética del Botón Central Vostok Tuner
- **Remodelación de Forma:** Cambiamos la curvatura tipo cápsula (`rounded-full`) del botón de lanzamiento principal por un radio de esquina cuadrangular redondeado **`rounded-xl`** (12px), unificando su silueta con el resto de módulos de la suite.
- **Look "Noir-Tech" y Bisel Fino:** Oscurecemos su fondo a un negro sólido mate (`bg-[#060606]`) con un sub-contenedor interno en negro puro (`bg-[#030303]`). Reemplazamos la franja verde fosforescente translúcida por un bisel de titanio ultra-fino (`border-white/10`) que reacciona iluminándose en hover con un haz verde neón.

### 📺 3. Rediseño de Visores Vectoriales a Alta Fidelidad (Fieles a Hardware)
- **Harmonic Radar (Círculo de Quintas):** Eliminamos la aguja analógica del visor antiguo. Implementamos un detector armónico concéntrico exacto de 12 nodos con sus correspondientes rayos radiales. Los tonos dominantes y detectados activos respiran con una animación sutil en un bucle lento de **`3.0 segundos`**.
- **SPL Meter (Medidor de Nivel Digital):** Reemplazamos la aguja tradicional por un visor OLED digital moderno. Renderizamos el número digital **`72 DBA`** cubierto por 5 finas líneas de escaneo horizontal (scanlines) estilo CRT, incorporando una barra de nivel de progreso horizontal inferior que oscila de forma sumamente amortiguada en un ciclo de **`4.0 segundos`**.
- **Scale Sensor (Tablatura de Guitarra):** Transformamos la gráfica abstracta anterior en una auténtica tablatura digital de guitarra de 6 cuerdas. Posicionamos los trastes melódicos (`7`, `9`, `5`, `0`) bloqueando el fondo de las cuerdas, cruzados por un barrido de haz láser vertical lento de **`4.5 segundos`** que simula una lectura de escala en tiempo real.

### 🛰️ 4. Barra de Telemetría Técnica de Alta Precisión
- **Módulo de Diagnóstico:** Añadimos una delgada franja técnica de telemetría directamente debajo del menú de navegación, con fondo negro translúcido, borde fino y desenfoque dinámico (`backdrop-blur-md`).
- **Datos Clave Desplegados:** Despliega métricas clave de audio en tiempo real: el estado del motor DSP, tasa de muestreo (SR), tamaño del buffer (BUF), latencia estimada (~10.7 MS), estado de salud del sistema (NOMINAL), fotogramas por segundo (FPS) y soberanía de ejecución local (LOCAL-FIRST).
- **Adaptabilidad Responsiva Inteligente:** Mediante clases de visualización condicional, la barra reduce su contenido de forma progresiva en pantallas móviles compactas para evitar amontonamientos, mostrando una triada minimalista perfectamente centrada (`DSP: ACTIVE`, `LATENCY` y `SYS: NOMINAL`), expandiéndose de forma automática a medida que el dispositivo gana espacio en pantalla.

### 💾 5. Sincronización e Integración en Git/GitHub
- **Registro de Cambios:** Confirmamos en el área de preparación únicamente el código fuente optimizado (`App.jsx`, `Tuner.jsx`, `ExperimentBlog.jsx` y `CHECKPOINT_MASTER.md`), manteniendo las capturas de imagen de referencia locales como archivos sin registrar.
- **Publicación de Cambios:** Consolidamos el commit bajo una nomenclatura técnica estructurada (`style(suite): professional UX/UI overhaul...`) y subimos con éxito todas las optimizaciones a la rama principal del repositorio de GitHub.

### 📦 6. Rendimiento y Compilación
- **Validación del Bundle:** Ejecutamos múltiples compilaciones de producción de Vite, garantizando que todos los cambios aplicados en los visores, layouts responsivos y animaciones de Framer Motion se consoliden en un empaquetado ultra-liviano, libre de errores, que compila de manera consistente en un promedio de **1.68 segundos**.

---

*Vostok Labs: Engineering the Future of Sound.*
