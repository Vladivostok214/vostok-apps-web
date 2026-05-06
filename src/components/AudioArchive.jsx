import React, { useState } from 'react';
import { Activity, Cpu, Radio, Zap, ChevronDown, Microchip, Database, ArrowLeft } from 'lucide-react';

// --- DATA: GENEALOGÍA DEL SONIDO (20 Hit Markers) ---
const AUDIO_PIONEERS = [
  {
    id: "pythagoras",
    name: "Pitágoras de Samos",
    era: "c. 570 – c. 495 AC",
    title: "Descubridor de las Relaciones Armónicas",
    description: "Filósofo y matemático griego. Descubrió la relación matemática profunda entre la longitud de una cuerda vibrante y el tono que produce. Al dividir una cuerda en proporciones enteras (2:1, 3:2, 4:3), estableció las bases de la escala musical, la octava, la quinta y la cuarta justa, uniendo para siempre la física, las matemáticas y el sonido.",
    specs: { "Dominio": "Física / Matemáticas", "Aporte": "Relaciones de Frecuencia", "Impacto": "Armonía Computacional" },
    tags: ["Armónicos", "Matemáticas", "Acústica Clásica"]
  },
  {
    id: "fourier",
    name: "Jean-Baptiste Fourier",
    era: "1768 – 1830",
    title: "Arquitecto del Análisis Espectral",
    description: "Matemático y físico francés. Postuló que cualquier señal compleja, sin importar cuán errática parezca, puede descomponerse en una serie infinita de ondas sinusoidales simples. Su trabajo es el bloque fundacional de todo el Procesamiento Digital de Señales (DSP) moderno.",
    specs: { "Dominio": "Análisis Matemático", "Aporte": "Transformada (FT)", "Impacto": "Núcleo de FFT y RTA" },
    tags: ["Algoritmos", "Matemáticas", "DSP Core"]
  },
  {
    id: "helmholtz",
    name: "Hermann von Helmholtz",
    era: "1821 – 1894",
    title: "Pionero de la Psicoacústica",
    description: "Físico y médico alemán que escribió 'Sobre las sensaciones del tono'. Inventó el Resonador de Helmholtz para aislar frecuencias específicas de un sonido complejo. Fue el primero en mapear la fisiología del oído interno y explicar cómo la cóclea humana actúa como un analizador espectral mecánico.",
    specs: { "Dominio": "Acústica Fisiológica", "Aporte": "Teoría de Resonancia", "Impacto": "Modelado Auditivo (IIR)" },
    tags: ["Psicoacústica", "Resonadores", "Fisiología"]
  },
  {
    id: "rayleigh",
    name: "Lord Rayleigh",
    era: "1842 – 1919",
    title: "Sistematizador de la Acústica",
    description: "Escribió 'The Theory of Sound', el texto más fundamental de la acústica mecánica. Definió las ecuaciones diferenciales de la propagación del sonido, la vibración de placas y membranas, y la dispersión (Scattering) que hoy usamos para diseñar difusores acústicos.",
    specs: { "Dominio": "Física Teórica", "Aporte": "Dispersión Acústica", "Impacto": "Modelado y Reverb" },
    tags: ["Física Acústica", "Ecuaciones", "Difusión"]
  },
  {
    id: "edison",
    name: "Thomas Alva Edison",
    era: "1847 – 1931",
    title: "Inventor de la Captura Sónica",
    description: "Inventor del fonógrafo (1877), la primera máquina capaz de grabar y reproducir sonido. Utilizó un cilindro recubierto de papel de estaño y un estilete para transducir la presión acústica en surcos físicos, iniciando la era de la tecnología de audio.",
    specs: { "Dominio": "Electromecánica", "Aporte": "Fonógrafo", "Impacto": "Almacenamiento de Audio" },
    tags: ["Transducción", "Analógico", "Hardware"]
  },
  {
    id: "hertz",
    name: "Heinrich Hertz",
    era: "1857 – 1894",
    title: "Descubridor de las Ondas EM",
    description: "Físico alemán que demostró de manera concluyente la existencia de las ondas electromagnéticas teorizadas por Maxwell. En su honor, la unidad estándar de medida para la frecuencia, el hercio (Hz), lleva su nombre. Fundamental para comprender la propagación de cualquier onda.",
    specs: { "Dominio": "Electromagnetismo", "Aporte": "Ondas EM", "Impacto": "Unidad Base (Hz)" },
    tags: ["Física", "Frecuencia", "Teoría de Ondas"]
  },
  {
    id: "sabine",
    name: "Wallace Clement Sabine",
    era: "1868 – 1919",
    title: "Padre de la Acústica de Salas",
    description: "Descubrió la relación entre el tamaño de una habitación, la absorción de sus superficies y su tiempo de reverberación. Formuló la Ecuación de Sabine (RT60), que es el estándar de oro utilizado hoy en día para calibrar y diseñar estudios, salas de conciertos y plugins de reverberación espacial.",
    specs: { "Dominio": "Acústica de Salas", "Aporte": "Fórmula RT60", "Impacto": "Algoritmos Reverb" },
    tags: ["Reverberación", "Arquitectura", "ISO"]
  },
  {
    id: "fletcher",
    name: "Harvey Fletcher",
    era: "1884 – 1981",
    title: "Arquitecto de la Percepción",
    description: "Junto con Wilden A. Munson, desarrolló las curvas de igual sonoridad (Fletcher-Munson). Descubrió que el oído humano no percibe todas las frecuencias al mismo volumen, siendo mucho menos sensible a los graves y agudos extremos. Este es el principio rector detrás del A-Weighting (dBA).",
    specs: { "Dominio": "Psicoacústica", "Aporte": "Curvas Sonoridad", "Impacto": "Ponderación (A, C, Z)" },
    tags: ["Ponderación A", "Sonoridad", "Bell Labs"]
  },
  {
    id: "nyquist",
    name: "Harry Nyquist",
    era: "1889 – 1976",
    title: "Pionero del Audio Digital",
    description: "Ingeniero de Bell Labs que descubrió que para representar digitalmente una señal analógica sin pérdida de información (aliasing), la frecuencia de muestreo debe ser al menos el doble de la frecuencia más alta contenida en la señal (Frecuencia de Nyquist).",
    specs: { "Dominio": "Teoría de Información", "Aporte": "Teorema Muestreo", "Impacto": "ADC / DAC (44.1kHz)" },
    tags: ["Muestreo", "Aliasing", "ADC"]
  },
  {
    id: "shannon",
    name: "Claude Shannon",
    era: "1916 – 2001",
    title: "Teoría de la Información",
    description: "Formalizó matemáticamente el Teorema de Nyquist-Shannon. Introdujo el concepto de 'bit' y definió los límites teóricos de compresión de datos y transmisión de información sobre un canal ruidoso. Todo formato digital (WAV, FLAC, MP3) existe gracias a su teoría.",
    specs: { "Dominio": "Matemáticas Discretas", "Aporte": "Límites de Shannon", "Impacto": "Codificación (PCM)" },
    tags: ["Codificación", "Digital", "Datos"]
  },
  {
    id: "blumlein",
    name: "Alan Blumlein",
    era: "1903 – 1942",
    title: "Inventor del Sonido Estéreo",
    description: "Ingeniero de EMI que patentó el sonido estéreo en 1931 ('binaural sound'). Inventó el par de micrófonos estéreo coincidente (Blumlein Pair), que utiliza dos micrófonos bidireccionales en un ángulo de 90 grados, creando una imagen espacial perfecta e inmersiva.",
    specs: { "Dominio": "Ingeniería de Audio", "Aporte": "Arreglo Blumlein", "Impacto": "Paneo Estereofónico" },
    tags: ["Estéreo", "Microfonía", "Espacial"]
  },
  {
    id: "dudley",
    name: "Homer Dudley",
    era: "1896 – 1980",
    title: "Creador de la Síntesis Vocal",
    description: "Inventó el Vocoder (Voice Operated Recorder) en 1939 para Bell Labs. Este dispositivo analizaba el habla humana, extraía su espectro y lo sintetizaba de nuevo. Inicialmente usado para encriptar comunicaciones en la WWII, se convirtió en el efecto icónico de la música electrónica.",
    specs: { "Dominio": "Telecomunicaciones", "Aporte": "Vocoder Analógico", "Impacto": "Análisis Espectral" },
    tags: ["Vocoder", "Síntesis", "Criptografía"]
  },
  {
    id: "lespaul",
    name: "Les Paul",
    era: "1915 – 2009",
    title: "El Mago del Multitrack",
    description: "Pionero en el desarrollo de la guitarra eléctrica de cuerpo sólido y genio de la grabación. Inventó la grabación multipista (Sound-on-Sound), el overdubbing, y técnicas tempranas de delay de cinta y phasing, definiendo el flujo de trabajo moderno de producción de audio.",
    specs: { "Dominio": "Producción Musical", "Aporte": "Grabación Multipista", "Impacto": "DAWs y Canales" },
    tags: ["Multitrack", "Delay", "Hardware"]
  },
  {
    id: "stockhausen",
    name: "Karlheinz Stockhausen",
    era: "1928 – 2007",
    title: "Vanguardia Electroacústica",
    description: "Compositor alemán pionero en la música electrónica temprana usando osciladores sinusoidales puros, manipulación de cinta y análisis serial del sonido. Su obra 'Gesang der Jünglinge' fue la primera en utilizar espacialización de sonido en un entorno envolvente (pre-surround).",
    specs: { "Dominio": "Composición", "Aporte": "Sistematización", "Impacto": "Diseño Espacial" },
    tags: ["Electroacústica", "Avant-Garde", "Cinta"]
  },
  {
    id: "moog",
    name: "Robert Moog",
    era: "1934 – 2005",
    title: "Maestro del Control por Voltaje",
    description: "Ingeniero y pionero de la música electrónica que diseñó el primer sintetizador modular comercial exitoso. Su gran innovación fue estandarizar el 'Control por Voltaje' (VCO, VCF, VCA), permitiendo que circuitos electrónicos 'hablaran' entre sí de manera estandarizada (1 Volt/Octava).",
    specs: { "Dominio": "Ingeniería Electrónica", "Aporte": "Sintetizador Modular", "Impacto": "Arquitectura VST" },
    tags: ["Sustractiva", "Filtros", "VCO"]
  },
  {
    id: "chowning",
    name: "John Chowning",
    era: "1932 – Presente",
    title: "Padre de la Síntesis FM",
    description: "Investigador en la Universidad de Stanford que descubrió el algoritmo de síntesis por modulación de frecuencia (FM) en 1967. Al modular rápidamente la frecuencia de un oscilador con otro, logró crear timbres increíblemente complejos y armónicos con muy poca carga computacional.",
    specs: { "Dominio": "Ciencias de Computación", "Aporte": "Síntesis FM", "Impacto": "Eficiencia Algorítmica" },
    tags: ["Síntesis FM", "Stanford", "Algoritmos C"]
  },
  {
    id: "dolby",
    name: "Ray Dolby",
    era: "1933 – 2013",
    title: "Erradicador de Ruido",
    description: "Ingeniero estadounidense que fundó Dolby Laboratories. Inventó el sistema de reducción de ruido Dolby A, que utilizaba compresión y expansión dependiente de la frecuencia (companding) para enmascarar el silbido de la cinta magnética, revolucionando la claridad del audio.",
    specs: { "Dominio": "Ingeniería Analógica", "Aporte": "Reducción de Ruido", "Impacto": "Algoritmos Denoise" },
    tags: ["SNR", "Dinámica", "Cine"]
  },
  {
    id: "schroeder",
    name: "Manfred Schroeder",
    era: "1926 – 2009",
    title: "Matemático de las Salas",
    description: "Físico y acústico en Bell Labs. Desarrolló los difusores de Residuo Cuadrático (QRD) utilizando teoría de números, logrando que el sonido se disperse uniformemente. También fue pionero en algoritmos matemáticos para simular reverberación artificial de alta calidad.",
    specs: { "Dominio": "Acústica Física", "Aporte": "Difusores QRD", "Impacto": "Reverb Algorítmica" },
    tags: ["QRD", "Reverberación", "Teoría Números"]
  },
  {
    id: "bose",
    name: "Amar Bose",
    era: "1929 – 2013",
    title: "Innovador en Transducción",
    description: "Profesor del MIT e ingeniero acústico. Estudió la psicoacústica de cómo percibimos el sonido rebotando en paredes. Desarrolló tecnologías de reflexión directa y fue pionero comercial de los auriculares con Cancelación Activa de Ruido (ANC) utilizando inversión de fase.",
    specs: { "Dominio": "Ingeniería Acústica", "Aporte": "Cancelación Activa (ANC)", "Impacto": "Procesamiento Anti-Fase" },
    tags: ["ANC", "Psicoacústica", "Transductores"]
  },
  {
    id: "smith",
    name: "Julius O. Smith III",
    era: "Activo",
    title: "Maestro del Modelado Físico",
    description: "Profesor de CCRMA en Stanford y pionero del procesamiento digital de señales musicales. Desarrolló la síntesis de guía de ondas digital (Digital Waveguide), que modela matemáticamente el comportamiento físico de tubos y cuerdas vibrantes en tiempo real.",
    specs: { "Dominio": "Señales Digitales", "Aporte": "Digital Waveguide", "Impacto": "Filtros y Modelado VST" },
    tags: ["DSP Matemático", "Modelado", "CCRMA"]
  }
];

export default function AudioArchive({ onClose }) {
  const [expandedId, setExpandedId] = useState(null);

  const handleToggle = (id) => {
    const isOpening = expandedId !== id;
    setExpandedId(isOpening ? id : null);
    
    if (isOpening) {
      setTimeout(() => {
        const element = document.getElementById(`card-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;700;900&display=swap');
        
        .vostok-archive-root {
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          background-color: #000000;
          color: #ffffff;
        }
        
        .vostok-archive-root .font-telemetry {
          font-family: 'JetBrains Mono', monospace;
        }

        .vostok-archive-root .vostok-grid {
          background-image: 
            linear-gradient(to right, rgba(57, 255, 20, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(57, 255, 20, 0.015) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .vostok-archive-root .glow-neon {
          text-shadow: 0 0 10px rgba(57, 255, 20, 0.6);
        }

        /* Scrollbar encapsulado para no afectar toda la app */
        .vostok-archive-root::-webkit-scrollbar { width: 4px; }
        .vostok-archive-root::-webkit-scrollbar-track { background: #000000; }
        .vostok-archive-root::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; }
        .vostok-archive-root::-webkit-scrollbar-thumb:hover { background: #39FF14; }
      `}</style>

      <div className="vostok-archive-root fixed inset-0 z-50 w-full h-full overflow-y-auto vostok-grid flex flex-col bg-black">
        
        {/* Vostok Header Integrable */}
        <header className="w-full border-b border-[#1a1a1a] bg-[#000000] sticky top-0 px-4 py-4 flex items-center justify-between shadow-2xl z-40">
          <div className="flex items-center space-x-3">
            {/* Botón Integración: Regresar al menú principal */}
            {onClose && (
              <button 
                onClick={onClose} 
                className="text-slate-500 hover:text-[#39FF14] transition-colors p-1"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            <Activity className="text-[#39FF14] w-6 h-6 animate-pulse" />
            <div>
              <h1 className="font-telemetry font-black text-base tracking-widest text-white">
                VOSTOK LABS <span className="text-[#39FF14]">/</span>
              </h1>
              <p className="font-telemetry text-[10px] text-cyan-500 uppercase tracking-wide">
                Audio Archive Databank
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 font-telemetry text-xs text-slate-500">
            <Activity className="w-4 h-4 text-slate-400"/> 
            <span className="hidden sm:inline">INDEX: </span>20
          </div>
        </header>

        {/* Main Feed */}
        <main className="flex-1 w-full max-w-2xl mx-auto p-3 sm:p-4 pb-20 relative z-10">
          <div className="space-y-3">
            {AUDIO_PIONEERS.map((figure, idx) => {
              const isExpanded = expandedId === figure.id;
              
              return (
                <article 
                  id={`card-${figure.id}`}
                  key={figure.id} 
                  className={`
                    border transition-colors duration-300 rounded-lg overflow-hidden
                    ${isExpanded ? 'border-[#39FF14]/40 bg-[#080808]' : 'border-[#1a1a1a] bg-[#050505] hover:border-[#333333]'}
                  `}
                >
                  <button 
                    onClick={() => handleToggle(figure.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between focus:outline-none"
                  >
                    <div className="flex items-start space-x-4">
                      <span className={`font-telemetry text-sm font-bold pt-1 ${isExpanded ? 'text-[#39FF14]' : 'text-slate-600'}`}>
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <div>
                        <h2 className="font-bold text-lg text-white tracking-tight">{figure.name}</h2>
                        <p className="font-telemetry text-xs text-cyan-400 mt-1 uppercase tracking-wide">
                          [{figure.title}]
                        </p>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-6 h-6 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#39FF14]' : 'text-slate-600'}`} 
                    />
                  </button>

                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-[#1a1a1a] bg-[#000000] animate-in slide-in-from-top-2 fade-in duration-300">
                      
                      <div className="flex justify-between items-center mb-5">
                         <span className="inline-block px-2 py-1 bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] font-telemetry text-[10px] uppercase tracking-widest rounded-sm glow-neon">
                           ID // {figure.id.toUpperCase()}
                         </span>
                         <span className="font-telemetry text-xs text-slate-500">{figure.era}</span>
                      </div>

                      <p className="text-slate-200 text-base sm:text-lg leading-relaxed font-normal mb-6">
                        {figure.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {figure.tags.map(tag => (
                          <span key={tag} className="px-3 py-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-full text-xs font-telemetry text-slate-300 flex items-center">
                            <Microchip className="w-3 h-3 mr-1.5 text-cyan-500" />
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {Object.entries(figure.specs).map(([key, value], idx) => (
                          <div key={key} className="bg-[#050505] border border-[#1a1a1a] rounded-md p-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#39FF14] opacity-30"></div>
                            <div className="flex items-center space-x-2 text-slate-500 mb-1.5">
                              {idx === 0 && <Radio className="w-3.5 h-3.5 text-cyan-500" />}
                              {idx === 1 && <Cpu className="w-3.5 h-3.5 text-cyan-500" />}
                              {idx === 2 && <Zap className="w-3.5 h-3.5 text-cyan-500" />}
                              <span className="font-telemetry text-[9px] uppercase tracking-wider">{key}</span>
                            </div>
                            <div className="font-telemetry font-bold text-sm text-white">
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}