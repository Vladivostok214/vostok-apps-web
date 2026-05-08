# Vostok Labs: REAPER VST/JSFX Integration Guide

Esta carpeta contiene la versión optimizada del ecosistema Vostok Labs para ser utilizada dentro de **REAPER**.

## 1. Plugins Nativos (JSFX)
Hemos portado las herramientas principales a **JSFX (REAPER's native format)** para una integración de baja latencia y alto rendimiento.

### Instalación:
1. Copia los archivos `.jsfx` de esta carpeta.
2. Abre REAPER y ve a `Options > Show REAPER resource path in explorer/finder`.
3. Entra en la carpeta `Effects`.
4. Crea una carpeta llamada `Vostok Labs` y pega los archivos allí.
5. En REAPER, abre el explorador de FX, dale a `Scan` y busca "Vostok".

### Incluidos:
- **Vostok Spectrum:** Analizador RTA de 4096 puntos con estética Noir-Tech.
- **Vostok SPL Meter:** Medidor de presión sonora calibrado (ISO 1996).

---

## 2. ReaScript (HUD Telemetry)
He incluido un **ReaScript en Lua** que funciona como un HUD (Head-Up Display) para monitorizar los parámetros del proyecto.

### Instalación:
1. Copia `VostokHUD.lua` a tu carpeta de ReaScripts (generalmente `Scripts` dentro del recurso de REAPER).
2. En REAPER, abre la lista de acciones (`Actions > Show action list`).
3. Haz clic en `New action > Load ReaScript`.
4. Selecciona `VostokHUD.lua`.
5. Ahora puedes ejecutarlo desde la lista de acciones o asignarle un botón/atajo.

---

## 3. Versión Completa (Web Interface)
Para utilizar la aplicación completa (Tuner, Genealogy, 3D Transitions) dentro de una ventana de REAPER:

### Configuración:
1. Ve a `Options > Preferences > Control/OSC/web`.
2. Haz clic en `Add` y selecciona `Web browser interface`.
3. En el campo `Default interface`, selecciona una (ej. `index`).
4. Haz clic en el botón `Open in default browser` para verificar que funciona.
5. **Para usar Vostok Labs:** Copia el contenido de la carpeta `/dist` de este proyecto a la carpeta `Plugins/reaper_wwwroot` dentro de tu directorio de recursos de REAPER.
6. Ahora podrás acceder a `localhost:8080` (o el puerto configurado) desde cualquier ventana de REAPER o navegador externo.

---

## 3. Especificaciones Técnicas (Noir-Tech)
- **Typografía:** JetBrains Mono 900 (Telemetría), Inter (UI).
- **Colores:** Vostok Neon Green (#39FF14), Cyan (#06B6D4).
- **Estándares:** ISO 1996, NIOSH (Dosímetro).

---
*Vostok Labs Agent - Scientific Integrity & Aesthetic Excellence*
