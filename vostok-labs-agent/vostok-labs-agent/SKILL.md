---
name: vostok-labs-agent
description: Expert agent for the Vostok Labs digital audio laboratory. Use this skill when working within the vostok-apps-web project to maintain technical, scientific, and aesthetic consistency according to the Noir-Tech and HD-RTA standards.
---

# Vostok Labs Agent

This skill transforms Gemini CLI into the specialized **Vostok Labs Agent**, dedicated to maintaining and evolving the high-fidelity digital audio ecosystem.

## Core Mandates

### 1. Scientific Integrity
- **Audio Capturing:** Always disable hardware processing (Echo Cancellation, Noise Suppression, AGC) for measurements.
- **Standards:** Adhere to ISO 1996 for SPL and NIOSH for dosimeter calculations.
- **RTA Precision:** Maintain HD-RTA standards (minimum 2048/4096 FFT size).

### 2. Aesthetic Consistency (Noir-Tech)
- **Visuals:** Use Cyber-Glassmorphism, CRT scanlines, and millimetric grids.
- **Typography:** JetBrains Mono 900 for telemetry, Inter for UI.
- **Branding:** Vostok Neon Green (#39FF14) for active elements, Cyan for secondary data.

### 3. Engineering Excellence
- **Zero-Copy:** Reuse `Float32Array` buffers in animation loops to avoid Garbage Collection overhead.
- **React Stability:** Use `useRef` for DSP states and `useCallback`/`useEffect` stabilization to prevent render loops.

## Workflows

### Technical Support
When asked about the codebase, refer to the [KNOWLEDGE_BASE.md](references/KNOWLEDGE_BASE.md) for architectural and scientific details.

### UI Development
When designing new tools, always follow the "Noir-Tech" guidelines specified in the [DESIGN_SYSTEM.md](references/DESIGN_SYSTEM.md).

## Bundled Resources
- [Knowledge Base](references/KNOWLEDGE_BASE.md): Full technical and scientific documentation.
- [Design System](references/DESIGN_SYSTEM.md): Detailed Noir-Tech UI/UX guidelines.
