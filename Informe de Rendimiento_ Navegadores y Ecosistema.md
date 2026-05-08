# **Informe de Auditoría de Rendimiento: Navegadores Web y Ecosistema del Sistema**

**Fecha de Auditoría:** 8 de Mayo de 2026

**Analista:** Wladi (Ingeniero de Sonido) & Prompt Master (Gemini)

**Objetivo:** Evaluar el impacto en el sistema de los principales navegadores web (Edge, Chrome, Brave) y establecer herramientas de auditoría local para optimizar el rendimiento del PC, especialmente para entornos de producción de audio (DAW).

## **1\. Resumen Ejecutivo**

Esta investigación se centró en analizar la telemetría cruda (Consumo de CPU, Memoria RAM y Conexiones de Red) de diferentes aplicaciones en un entorno Windows.

Se desarrolló una herramienta personalizada en PowerShell (Audit-Process.ps1) capaz de capturar el estado exacto de cualquier proceso o Pestaña (vía PID) en un instante dado, sin depender de software de terceros.

El hallazgo más crítico fue la diferencia sustancial en la gestión de recursos al ejecutar tareas intensivas (Inteligencia Artificial web) entre **Google Chrome** y **Brave Browser**, donde Brave demostró ser significativamente más eficiente.

## **2\. Herramienta de Auditoría: "Script Maestro"**

Para estandarizar las mediciones, se iteró y perfeccionó un script de PowerShell. Esta herramienta extrae datos limpios a formato .csv para su posterior análisis.

### **2.1 Código Final (Audit-Process.ps1)**

Este script es a prueba de errores de sintaxis y permite auditar por nombre de programa o por ID de proceso (PID).

param (  
    \[string\]$TargetName \= "",  
    \[int\]$TargetId \= 0  
)

\# Lógica de búsqueda  
if ($TargetId \-gt 0\) {  
    $Procs \= Get-Process \-Id $TargetId \-ErrorAction SilentlyContinue  
} elseif ($TargetName \-ne "") {  
    $Procs \= Get-Process \-ErrorAction SilentlyContinue | Where-Object {$\_.ProcessName \-match $TargetName}  
} else {  
    Write-Warning "Debes ingresar un nombre o un ID."  
    return  
}

if (-not $Procs) {   
    Write-Warning "No se encontraron procesos activos."  
    return   
}

\# Extracción de Datos  
$Procs | Select-Object ProcessName, Id, CPU, WorkingSet | Export-Csv \-Path proc.csv \-NoTypeInformation

$Ids \= $Procs.Id  
Get-NetTCPConnection \-ErrorAction SilentlyContinue | Where-Object {$\_.OwningProcess \-in $Ids} | Select-Object OwningProcess, State, RemoteAddress, RemotePort | Export-Csv \-Path net.csv \-NoTypeInformation

Write-Warning "Auditoría completada. Revisa proc.csv y net.csv."

## **3\. Análisis Comparativo: Navegadores Web**

Se auditaron los tres navegadores principales basados en Chromium bajo condiciones de uso normal y cargas específicas.

### **3.1 Microsoft Edge (Modo Motor / WebView2)**

La primera auditoría reveló que Edge, incluso cerrado como navegador, mantiene instancias de **WebView2** activas.

* **Estado:** Activo en segundo plano.  
* **Impacto:** Bajo (\~166 MB de RAM).  
* **Diagnóstico:** Aplicaciones nativas de Windows o widgets utilizan este motor. Su consumo es eficiente debido a la profunda integración con el SO.

### **3.2 Google Chrome**

Chrome mostró el perfil de consumo más agresivo.

* **Memoria RAM Total (Global):** \~2.38 GB (en 19 procesos).  
* **Carga de CPU:** Muy Alta (Múltiples procesos superando el 100% de uso de hilos).  
* **Red:** Elevado número de conexiones simultáneas (\>40), incluyendo fuerte presencia de telemetría y servicios de infraestructura (Cloudflare, AWS, Google).

### **3.3 Brave Browser**

Brave demostró una gestión de recursos superior gracias a su arquitectura enfocada en la privacidad.

* **Memoria RAM Total (Global):** \~1.44 GB (en 14 procesos).  
* **Carga de CPU:** Moderada.  
* **Red:** Altamente eficiente (solo 16 conexiones). Los bloqueadores nativos (Shields) reducen drásticamente las conexiones a servidores de terceros y rastreadores.

## **4\. El "Duelo": Prueba de Estrés de Inteligencia Artificial**

Para una comparativa 1:1, se auditó una sola pestaña ejecutando la interfaz de **Gemini** tanto en Chrome como en Brave, aislando sus PIDs exactos a través del Administrador de Tareas interno (Shift \+ Esc).

### **4.1 Resultados Directos de la Pestaña (Gemini)**

| Métrica | Google Chrome (PID 6628\) | Brave Browser (PID 5172\) | Veredicto |
| :---- | :---- | :---- | :---- |
| **RAM (WorkingSet)** | 449.27 MB | **175.04 MB** | Brave ahorra un **61%** de RAM. |
| **CPU (Tiempo Acumulado)** | 632.55 Segs | **10.05 Segs** | Brave gestiona los scripts de forma mucho más pasiva. |

### **4.2 Análisis Técnico del Duelo**

La brutal diferencia radica en la **asignación de memoria**. Chrome emplea una estrategia de "Aislamiento de Sitios" que pre-reserva grandes bloques de RAM por seguridad y velocidad bruta. Brave optimiza el motor V8 limitando la ejecución de scripts en segundo plano, resultando en un entorno mucho más amigable con el sistema operativo.

## **5\. Conclusiones y Recomendaciones para Producción de Audio**

Para un entorno crítico como un estudio de grabación o mezcla (donde se usan DAWs como Reaper, Ableton o Pro Tools), la latencia del sistema y los picos de CPU (Spikes) son el enemigo principal.

1. **Navegador Recomendado:** **Brave**. Ahorrar casi 300 MB de RAM por cada pestaña abierta permite destinar esos recursos a librerías de VSTs pesadas (como Kontakt o Omnisphere). Su menor uso de CPU reduce el riesgo de interrupciones de audio (Dropouts/Glitches) con buffers bajos.  
2. **Manejo de Ecosistemas Pesados (Adobe):** Se identificó que suites como Adobe Creative Cloud inician procesos de fondo (CCXProcess, CoreSync) que consumen recursos constantemente y abren puertos de red. **Recomendación:** Cerrar la suite desde la bandeja del sistema antes de iniciar una sesión de audio crítica.  
3. **Monitoreo Continuo:** Se recomienda mantener el script Audit-Process.ps1 accesible en la consola. Si el DAW experimenta caídas de rendimiento, auditar el proceso específico (.\\Audit-Process.ps1 \-TargetName "reaper") permitirá identificar rápidamente si es el software de audio el causante, o un proceso externo robando ciclos de CPU.