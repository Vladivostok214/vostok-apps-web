import { useState, useEffect, useRef, useCallback, lazy, Suspense, memo, useId } from 'react';
import { 
  Activity, Check, Settings, Upload, Waves, X, ChevronRight, 
  Smartphone, LayoutGrid, Plus, Minus, ArrowLeft, 
  Music, Zap, Send, ChevronDown, Volume2, Terminal, BookOpen
} from 'lucide-react';
import TempoSense from './TempoSense';
import SpectrumAnalyzer from './SpectrumAnalyzer';
import SPLMeter from './SPLMeter';
import VostokTuner from './Tuner';
const ScaleSensor = lazy(() => import('./ScaleSensor'));
const HarmonicRadar = lazy(() => import('./HarmonicRadar'));
import { TuningForkIcon, VostokLogo, GraphicIcon } from './components/VostokIdentity';
// Lazy loaded components
const ImpulseResponse = lazy(() => import('./ImpulseResponse'));
import AudioArchive from './components/AudioArchive';
import ExperimentBlog from './components/ExperimentBlog';
import Footer from './components/Footer';
import InfoModal from './components/InfoModal';
import DiagnosticConsole from './components/DiagnosticConsole';
import AudioSettingsModal from './components/AudioSettingsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { initAnalytics, trackEvent } from './lib/analytics';
import { App as CapacitorApp } from '@capacitor/app';

// --- VOSTOK SYSTEM: NON-INVASIVE HEALTH MONITOR ---
function SystemHealth({ errors }) {
  if (errors.length === 0) return null;
  
  const latestError = errors[errors.length - 1];
  const color = latestError.type === 'CRITICAL' ? '#ef4444' : '#f59e0b';
  
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex flex-col items-center pointer-events-none"
    >
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 px-6 py-2.5 rounded-full flex items-center gap-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color }}>{latestError.type}_ALERT</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{latestError.message}</span>
      </div>
      <div className="mt-2 flex gap-1">
        {errors.map((_, i) => (
          <div key={i} className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color, opacity: i === errors.length - 1 ? 1 : 0.2 }} />
        ))}
      </div>
    </motion.div>
  );
}

// --- HOOKS PERSONALIZADOS ---
const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }
    return false;
  });

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const isMobileBrowser = typeof window !== 'undefined' && /iphone|ipad|ipod|android/.test(window.navigator.userAgent.toLowerCase());
  const canShowMobile = !isInstalled && isMobileBrowser;
  
  return { canInstall: !!installPrompt, canShowMobile, installApp, isInstalled };
};

// Monta el componente solo cuando el placeholder entra al viewport.
// Evita que secciones off-screen arranquen sus animaciones de Framer Motion.
const useLazySection = (rootMargin = '200px') => {
  const [shouldRender, setShouldRender] = useState(false);
  const placeholderRef = useRef(null);
  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShouldRender(true); observer.disconnect(); } },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { shouldRender, placeholderRef };
};

const PROTAGONISTAS = [
  {
    id: 'pitagoras',
    nombre: 'PITÁGORAS',
    titulo: 'El Monocordio',
    descripcion: 'Estableció que la música es matemática pura. Al dividir una cuerda en radios exactos (2:1, 3:2), sentó las bases de la escala musical y los intervalos que hoy rigen la afinación occidental.',
    grafico: 'triangle',
    color: '#00f5ff'
  },
  {
    id: 'sauveur',
    nombre: 'JOSEPH SAUVEUR',
    titulo: 'Padre de la Acústica',
    descripcion: 'Científico sordo que acuñó el término "Acústica". Fue el primero en calcular la frecuencia absoluta de un sonido e identificar físicamente los nodos y vientres en cuerdas vibrantes.',
    grafico: 'nodes',
    color: '#00d1ff'
  },
  {
    id: 'chladni',
    nombre: 'ERNST CHLADNI',
    titulo: 'El Visualizador',
    descripcion: 'Reveló la geometría invisible del sonido. Sus experimentos con arena sobre placas de metal mostraron patrones simétricos complejos, demostrando que el sonido tiene una forma física.',
    grafico: 'symmetry',
    color: '#00b8ff'
  },
  {
    id: 'helmholtz',
    nombre: 'VON HELMHOLTZ',
    titulo: 'Analista del Timbre',
    descripcion: 'Inventó los resonadores esféricos para descomponer sonidos complejos. Su trabajo permitió entender cómo el cerebro humano distingue la "huella digital" o color tonal de cada instrumento.',
    grafico: 'resonator',
    color: '#0099ff'
  },
  {
    id: 'edison',
    nombre: 'THOMAS EDISON',
    titulo: 'Registro Mecánico',
    descripcion: 'Con el fonógrafo, logró que el sonido dejara de ser efímero. Transformó la presión del aire en surcos físicos, permitiendo por primera vez el análisis y la reproducción de la onda capturada.',
    grafico: 'cylinder',
    color: '#7000ff'
  },
  {
    id: 'edison-2',
    nombre: 'LEE DE FOREST',
    titulo: 'Amplificación Electrónica',
    descripcion: 'Su invento, el triodo, permitió amplificar señales eléctricas débiles. Es el ancestro directo de todos los preamplificadores que hoy procesan la señal de audio antes de ser analizada.',
    grafico: 'triode',
    color: '#a000ff'
  },
  {
    id: 'conn',
    nombre: 'CONN LTD.',
    titulo: 'Precisión Estroboscópica',
    descripcion: 'Lanzaron el Stroboconn en 1936. Utilizaba discos giratorios y luz de neón para lograr una precisión de 0.1 cents, la referencia mecánica que Vostok ahora lleva al plano digital.',
    grafico: 'strobe',
    color: '#00ffc8'
  },
  {
    id: 'cooley',
    nombre: 'COOLEY & TUKEY',
    titulo: 'Algoritmo FFT',
    descripcion: 'Desarrollaron la Transformada Rápida de Fourier. Es el motor matemático que permite a los procesadores modernos descomponer el audio en frecuencias individuales en tiempo real.',
    grafico: 'spectrum',
    color: '#00ff8c'
  },
  {
    id: 'cheveigne',
    nombre: 'ALAIN DE CHEVEIGNÉ',
    titulo: 'Algoritmo YIN',
    descripcion: 'Revolucionó la detección de tono con el algoritmo YIN. Su lógica de estimación de frecuencia permite que el afinador sea estable y preciso incluso con señales complejas o ruidosas.',
    grafico: 'correlation',
    color: '#00ff55'
  }
];

// --- UNIFIED HITO CARD FOR HISTORICAL 3D REEL/CAROUSEL ---
const HitoCard = ({ hito, diff, isMobile, onClick, hitoIndex, totalHitos }) => {
  const isCenter = diff === 0;
  
  // Dynamic 3D Coordinates & Filters based on circular difference
  const getDesktopStyles = (d) => {
    if (d === 0) {
      return { x: "-50%", y: "-50%", scale: 1.0, opacity: 1.0, filter: "blur(0px)", zIndex: 20, pointerEvents: "auto" };
    }
    if (d === -1) {
      return { x: "-110%", y: "-50%", scale: 0.82, opacity: 0.55, filter: "blur(0.5px)", zIndex: 10, pointerEvents: "none" };
    }
    if (d === 1) {
      return { x: "10%", y: "-50%", scale: 0.82, opacity: 0.55, filter: "blur(0.5px)", zIndex: 10, pointerEvents: "none" };
    }
    if (d < -1) {
      return { x: "-180%", y: "-50%", scale: 0.65, opacity: 0, filter: "blur(2px)", zIndex: 0, pointerEvents: "none" };
    }
    return { x: "80%", y: "-50%", scale: 0.65, opacity: 0, filter: "blur(2px)", zIndex: 0, pointerEvents: "none" };
  };

  const getMobileStyles = (d) => {
    if (d === 0) {
      return { x: "-50%", y: "-50%", scale: 1.0, opacity: 1.0, filter: "blur(0px)", zIndex: 20, pointerEvents: "auto" };
    }
    if (d === -1) {
      return { x: "-50%", y: "-90%", scale: 0.85, opacity: 0.65, filter: "blur(0.5px)", zIndex: 10, pointerEvents: "none" };
    }
    if (d === 1) {
      return { x: "-50%", y: "-10%", scale: 0.85, opacity: 0.65, filter: "blur(0.5px)", zIndex: 10, pointerEvents: "none" };
    }
    if (d < -1) {
      return { x: "-50%", y: "-140%", scale: 0.7, opacity: 0, filter: "blur(2px)", zIndex: 0, pointerEvents: "none" };
    }
    return { x: "-50%", y: "40%", scale: 0.7, opacity: 0, filter: "blur(2px)", zIndex: 0, pointerEvents: "none" };
  };

  const styles = isMobile ? getMobileStyles(diff) : getDesktopStyles(diff);

  return (
    <motion.div
      animate={styles}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      onClick={isCenter ? onClick : undefined}
      className={`absolute top-1/2 left-1/2 rounded-[2rem] border overflow-hidden shadow-2xl transition-colors duration-500 flex flex-col justify-between group select-none
        ${isMobile ? 'w-[92%] h-[280px] p-5' : 'w-[28rem] h-[360px] p-8'}
        ${isCenter 
          ? 'bg-[#0A0A0A] border-cyan-500/25 group-hover:border-cyan-500/45 cursor-pointer pointer-events-auto' 
          : 'bg-[#0A0A0A]/40 border-white/5 hover:border-white/10 hover:opacity-80 cursor-default pointer-events-none'
        }
      `}
    >
      {/* Background GraphicIcon */}
      <div className={`absolute pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3
        ${isMobile 
          ? 'right-[-25px] top-[-25px] w-40 h-40 opacity-20' 
          : 'right-[-35px] top-[-35px] w-56 h-56 opacity-25'
        }
      `}>
        <GraphicIcon type={hito.grafico} color={hito.color} />
      </div>

      {/* Content wrapper */}
      <div className="relative flex flex-col h-full justify-between z-10">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className={`font-mono text-cyan-500 tracking-[0.25em] font-black uppercase opacity-60 block
                ${isMobile ? 'text-[7.5px] mb-0.5' : 'text-[9px] mb-1'}
              `}>
                HITOS_TECNOLÓGICOS // ARCHIVE
              </span>
              <h3 className={`font-black text-white tracking-tight uppercase leading-none
                ${isMobile ? 'text-xl' : 'text-2xl'}
              `}>
                {hito.nombre}
              </h3>
            </div>
            <div className={`rounded-full bg-white/5 border border-white/10 transition-colors
              ${isCenter ? 'group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20' : ''}
              ${isMobile ? 'p-1.5' : 'p-2.5'}
            `}>
              <ChevronRight className={`text-cyan-400 ${isMobile ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} ${diff === -1 ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Subtitle & Description */}
          <div className={`${isMobile ? 'mb-2' : 'mb-4'}`}>
            <span className={`inline-block font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 rounded
              ${isMobile ? 'px-2 py-0.5 text-[7.5px] mb-2' : 'px-3 py-1 text-[9px] mb-3'}
            `}>
              {hito.titulo}
            </span>
            <p className={`text-slate-300 leading-relaxed font-light border-l-2 border-cyan-500/20
              ${isMobile ? 'text-[11px] pl-3 line-clamp-3' : 'text-[13px] pl-4 line-clamp-4'}
            `}>
              {hito.descripcion}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t border-white/5 flex items-center justify-between
          ${isMobile ? 'pt-2.5' : 'pt-4'}
        `}>
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[7px] uppercase tracking-widest text-slate-600 font-bold mb-0.5">Origen</span>
              <span className={`font-mono text-cyan-400 uppercase font-black tracking-wider
                ${isMobile ? 'text-[9px]' : 'text-[10px]'}
              `}>
                Archivo_Vostok
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] uppercase tracking-widest text-slate-600 font-bold mb-0.5">Hito</span>
              <span className={`font-mono text-slate-400 uppercase font-bold
                ${isMobile ? 'text-[9px]' : 'text-[10px]'}
              `}>
                {hitoIndex + 1} / {totalHitos}
              </span>
            </div>
          </div>
          <div className={`opacity-25 ${isMobile ? 'h-4 w-12' : 'h-5 w-16'}`}>
            <svg viewBox="0 0 100 20" className="w-full h-full">
              <path d="M0 10 L10 10 L15 2 L25 18 L30 10 L100 10" stroke={hito.color} fill="none" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Glow radial overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
        style={{ background: `radial-gradient(circle at center, ${hito.color}05 0%, transparent 70%)` }} 
      />
    </motion.div>
  );
};

// --- HIGH-FIDELITY ACTIVE MINI SCREEN WIDGETS ---
// React.memo: evita re-renders cuando solo cambia hoveredToolKey u otros estados de App
const ToolMiniScreen = memo(({ toolKey }) => {
  // useId: garantiza IDs únicos por instancia para evitar <defs id> duplicados en el DOM
  const uid = useId().replace(/:/g, '-');
  switch (toolKey) {
    case 'tuner':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-0.5 select-none pointer-events-none">
          {/* Semicircular dark gauge arc */}
          <path d="M 8 18 A 12 12 0 0 1 32 18" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 8 18 A 12 12 0 0 1 32 18" fill="none" stroke="#39FF14" strokeWidth="1" strokeLinecap="round" opacity="0.15" />
          
          {/* Active orange needle centered on a green pivot */}
          <motion.line 
            x1="20" y1="20" x2="26" y2="10" 
            stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round"
            style={{ originX: "20px", originY: "20px" }}
            initial={{ rotate: 0 }}
            animate={{ rotate: [-4, 6, -1, 3, -5, -4] }}
            transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
          />
          {/* Green pivot node */}
          <circle cx="20" cy="20" r="1.5" fill="#39FF14" />

          {/* Large Bold Note Letter 'E' with superscript '3' */}
          <text x="18" y="34" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">E</text>
          <text x="26" y="24" fill="#888888" fontSize="8" fontWeight="700" fontFamily="sans-serif">3</text>

          {/* Cyan glow arrow pointing down on the right of the E */}
          <motion.path 
            d="M 31 25 L 35 25 L 33 29 Z" 
            fill="#06b6d4" 
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      );
    case 'scales':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-0.5 select-none pointer-events-none">
          {/* 6 Horizontal lines representing guitar strings */}
          <line x1="2" y1="8" x2="38" y2="8" stroke="#39FF14" strokeWidth="0.5" opacity="0.15" /> {/* e (1st string) */}
          <line x1="2" y1="13" x2="38" y2="13" stroke="#39FF14" strokeWidth="0.5" opacity="0.15" /> {/* B */}
          <line x1="2" y1="18" x2="38" y2="18" stroke="#39FF14" strokeWidth="0.5" opacity="0.15" /> {/* G */}
          <line x1="2" y1="23" x2="38" y2="23" stroke="#39FF14" strokeWidth="0.5" opacity="0.15" /> {/* D */}
          <line x1="2" y1="28" x2="38" y2="28" stroke="#39FF14" strokeWidth="0.5" opacity="0.15" /> {/* A */}
          <line x1="2" y1="33" x2="38" y2="33" stroke="#39FF14" strokeWidth="0.5" opacity="0.15" /> {/* E (6th string) */}

          {/* Scale Note 1: Fret '7' on 2nd string (y=13) */}
          <motion.g 
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.2 }}
            style={{ originX: "10px", originY: "13px" }}
          >
            <circle cx="10" cy="13" r="3" fill="#060606" stroke="#39FF14" strokeWidth="0.75" />
            <text x="10" y="15" fill="#39FF14" fontSize="5.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">7</text>
          </motion.g>

          {/* Scale Note 2: Fret '9' on 4th string (y=23) */}
          <motion.g 
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1.0 }}
            style={{ originX: "18px", originY: "23px" }}
          >
            <circle cx="18" cy="23" r="3" fill="#060606" stroke="#39FF14" strokeWidth="0.75" />
            <text x="18" y="25" fill="#39FF14" fontSize="5.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">9</text>
          </motion.g>

          {/* Scale Note 3: Fret '5' on 3rd string (y=18) */}
          <motion.g 
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1.8 }}
            style={{ originX: "26px", originY: "18px" }}
          >
            <circle cx="26" cy="18" r="3" fill="#060606" stroke="#39FF14" strokeWidth="0.75" />
            <text x="26" y="20" fill="#39FF14" fontSize="5.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">5</text>
          </motion.g>

          {/* Scale Note 4: Fret '0' on 5th string (y=28) */}
          <motion.g 
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 2.6 }}
            style={{ originX: "32px", originY: "28px" }}
          >
            <circle cx="32" cy="28" r="3" fill="#060606" stroke="#39FF14" strokeWidth="0.75" />
            <text x="32" y="30" fill="#39FF14" fontSize="5.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">0</text>
          </motion.g>

          {/* Smooth scanning beam sweep across strings (no sudden movements) */}
          <motion.line 
            x1="0" y1="5" x2="0" y2="35" 
            stroke="#39FF14" strokeWidth="0.5" opacity="0.3"
            initial={{ x: 4 }}
            animate={{ x: [4, 36, 4] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          />
        </svg>
      );
    case 'radar':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-0.5 select-none pointer-events-none">
          {/* Radial Lines from absolute center (20, 20) representing circle of fifths rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => {
            const rad = (angle * Math.PI) / 180;
            const r = 13;
            const x2 = 20 + r * Math.sin(rad);
            const y2 = 20 - r * Math.cos(rad);
            return (
              <line 
                key={`line-${idx}`} 
                x1="20" y1="20" 
                x2={x2} y2={y2} 
                stroke="#39FF14" strokeWidth="0.5" 
                opacity="0.25" 
              />
            );
          })}

          {/* Central intersection node */}
          <circle cx="20" cy="20" r="1.5" fill="#39FF14" />

          {/* 12 Circle of Fifths nodes around the ring */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => {
            const rad = (angle * Math.PI) / 180;
            const r = 13;
            const cx = 20 + r * Math.sin(rad);
            const cy = 20 - r * Math.cos(rad);
            
            // Highlight active detected key nodes (C, G, F) with very gentle breathing pulse
            const isActive = idx === 0 || idx === 1 || idx === 11;
            
            return (
              <g key={`node-${idx}`}>
                {/* Subtle outer circular aura outline */}
                <circle 
                  cx={cx} cy={cy} 
                  r="2.5" 
                  fill="none" 
                  stroke="#39FF14" 
                  strokeWidth="0.25" 
                  opacity={isActive ? 0.35 : 0.1} 
                />
                
                {/* Active node breathing smoothly (3.0s - no sudden/harsh moves) */}
                {isActive ? (
                  <motion.circle 
                    cx={cx} cy={cy} 
                    r="1.5" 
                    fill="#39FF14" 
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 3.0, ease: "easeInOut", delay: idx * 0.4 }}
                  />
                ) : (
                  <circle 
                    cx={cx} cy={cy} 
                    r="1" 
                    fill="#39FF14" 
                    opacity="0.4" 
                  />
                )}
              </g>
            );
          })}
        </svg>
      );
    case 'spectrum':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-0.5 select-none pointer-events-none">
          {/* Background horizontal grid lines */}
          <line x1="2" y1="8" x2="38" y2="8" stroke="#111" strokeWidth="0.5" />
          <line x1="2" y1="15" x2="38" y2="15" stroke="#111" strokeWidth="0.5" />
          <line x1="2" y1="22" x2="38" y2="22" stroke="#111" strokeWidth="0.5" />
          
          {/* Sonic peaks path (filled area with gradient) */}
          <defs>
            <linearGradient id={`specGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#39FF14" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          
          {/* Dynamic mountain peaks */}
          <motion.path 
            d="M 2 25 Q 7 24 10 14 Q 13 8 16 18 Q 19 25 22 20 Q 25 12 28 16 Q 32 25 38 25" 
            fill={`url(#specGrad-${uid})`} 
          />
          <motion.path 
            d="M 2 25 Q 7 24 10 14 Q 13 8 16 18 Q 19 25 22 20 Q 25 12 28 16 Q 32 25 38 25" 
            fill="none" 
            stroke="#39FF14" 
            strokeWidth="1.25" 
            strokeLinecap="round"
            initial={{ d: "M 2 25 Q 7 24 10 14 Q 13 8 16 18 Q 19 25 22 20 Q 25 12 28 16 Q 32 25 38 25" }}
            animate={{ d: [
              "M 2 25 Q 7 24 10 14 Q 13 8 16 18 Q 19 25 22 20 Q 25 12 28 16 Q 32 25 38 25",
              "M 2 25 Q 7 22 10 18 Q 13 12 16 14 Q 19 22 24 24 Q 25 10 28 12 Q 32 25 38 25",
              "M 2 25 Q 7 24 10 14 Q 13 8 16 18 Q 19 25 22 20 Q 25 12 28 16 Q 32 25 38 25"
            ] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          />

          {/* Vertical white/green peak line with central dot */}
          <line x1="16" y1="2" x2="16" y2="25" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
          <line x1="16" y1="2" x2="16" y2="25" stroke="#39FF14" strokeWidth="1.5" opacity="0.1" />
          <circle cx="16" cy="18" r="1" fill="#39FF14" stroke="#ffffff" strokeWidth="0.5" />

          {/* Spectrogram separator (Topografía Sónica) */}
          <line x1="2" y1="28" x2="38" y2="28" stroke="#06b6d4" strokeWidth="0.5" opacity="0.4" />

          {/* Sonic topography pixel blocks (Blue-Green cascading spectrogram) */}
          <g opacity="0.8">
            {/* Column 1 */}
            <motion.rect x="5" y="30" width="4" height="2" rx="0.5" fill="#0033aa" initial={{ fill: "#0033aa" }} animate={{ fill: ["#0033aa", "#00ffcc", "#39FF14", "#0033aa"] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.1 }} />
            <motion.rect x="5" y="33" width="4" height="2" rx="0.5" fill="#00ffcc" initial={{ fill: "#00ffcc" }} animate={{ fill: ["#00ffcc", "#39FF14", "#0033aa", "#00ffcc"] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.3 }} />
            <motion.rect x="5" y="36" width="4" height="2" rx="0.5" fill="#39FF14" initial={{ fill: "#39FF14" }} animate={{ fill: ["#39FF14", "#0033aa", "#00ffcc", "#39FF14"] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.5 }} />

            {/* Column 2 */}
            <motion.rect x="11" y="30" width="4" height="2" rx="0.5" fill="#39FF14" initial={{ fill: "#39FF14" }} animate={{ fill: ["#39FF14", "#0033aa", "#00ffcc", "#39FF14"] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.2 }} />
            <motion.rect x="11" y="33" width="4" height="2" rx="0.5" fill="#0033aa" initial={{ fill: "#0033aa" }} animate={{ fill: ["#0033aa", "#00ffcc", "#39FF14", "#0033aa"] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.4 }} />
            <motion.rect x="11" y="36" width="4" height="2" rx="0.5" fill="#00ffcc" initial={{ fill: "#00ffcc" }} animate={{ fill: ["#00ffcc", "#39FF14", "#0033aa", "#00ffcc"] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }} />

            {/* Column 3 (Peak column matching vertical peak) */}
            <motion.rect x="17" y="30" width="4" height="2" rx="0.5" fill="#00ffcc" initial={{ fill: "#00ffcc" }} animate={{ fill: ["#00ffcc", "#39FF14", "#0033aa", "#00ffcc"] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} />
            <motion.rect x="17" y="33" width="4" height="2" rx="0.5" fill="#39FF14" initial={{ fill: "#39FF14" }} animate={{ fill: ["#39FF14", "#0033aa", "#00ffcc", "#39FF14"] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.25 }} />
            <motion.rect x="17" y="36" width="4" height="2" rx="0.5" fill="#0033aa" initial={{ fill: "#0033aa" }} animate={{ fill: ["#0033aa", "#00ffcc", "#39FF14", "#0033aa"] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} />

            {/* Column 4 */}
            <motion.rect x="23" y="30" width="4" height="2" rx="0.5" fill="#0033aa" initial={{ fill: "#0033aa" }} animate={{ fill: ["#0033aa", "#00ffcc", "#39FF14", "#0033aa"] }} transition={{ repeat: Infinity, duration: 2.0, delay: 0.3 }} />
            <motion.rect x="23" y="33" width="4" height="2" rx="0.5" fill="#00ffcc" initial={{ fill: "#00ffcc" }} animate={{ fill: ["#00ffcc", "#39FF14", "#0033aa", "#00ffcc"] }} transition={{ repeat: Infinity, duration: 2.0, delay: 0.5 }} />
            <motion.rect x="23" y="36" width="4" height="2" rx="0.5" fill="#39FF14" initial={{ fill: "#39FF14" }} animate={{ fill: ["#39FF14", "#0033aa", "#00ffcc", "#39FF14"] }} transition={{ repeat: Infinity, duration: 2.0, delay: 0.7 }} />

            {/* Column 5 */}
            <motion.rect x="29" y="30" width="4" height="2" rx="0.5" fill="#39FF14" initial={{ fill: "#39FF14" }} animate={{ fill: ["#39FF14", "#0033aa", "#00ffcc", "#39FF14"] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} />
            <motion.rect x="29" y="33" width="4" height="2" rx="0.5" fill="#0033aa" initial={{ fill: "#0033aa" }} animate={{ fill: ["#0033aa", "#00ffcc", "#39FF14", "#0033aa"] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} />
            <motion.rect x="29" y="36" width="4" height="2" rx="0.5" fill="#00ffcc" initial={{ fill: "#00ffcc" }} animate={{ fill: ["#00ffcc", "#39FF14", "#0033aa", "#00ffcc"] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.8 }} />

            {/* Column 6 */}
            <motion.rect x="35" y="30" width="4" height="2" rx="0.5" fill="#00ffcc" initial={{ fill: "#00ffcc" }} animate={{ fill: ["#00ffcc", "#39FF14", "#0033aa", "#00ffcc"] }} transition={{ repeat: Infinity, duration: 1.7, delay: 0.5 }} />
            <motion.rect x="35" y="33" width="4" height="2" rx="0.5" fill="#39FF14" initial={{ fill: "#39FF14" }} animate={{ fill: ["#39FF14", "#0033aa", "#00ffcc", "#39FF14"] }} transition={{ repeat: Infinity, duration: 1.7, delay: 0.7 }} />
            <motion.rect x="35" y="36" width="4" height="2" rx="0.5" fill="#0033aa" initial={{ fill: "#0033aa" }} animate={{ fill: ["#0033aa", "#00ffcc", "#39FF14", "#0033aa"] }} transition={{ repeat: Infinity, duration: 1.7, delay: 0.9 }} />
          </g>
        </svg>
      );
    case 'tempo':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-0.5 select-none pointer-events-none">
          {/* Expanding rhythmic beat pulse rings */}
          <motion.circle 
            cx="20" cy="18" r="10" 
            fill="none" stroke="#06b6d4" strokeWidth="1"
            initial={{ r: 10, opacity: 0.8 }}
            animate={{ r: [6, 16, 8], opacity: [0.8, 0, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.0, ease: "easeOut" }}
          />
          <motion.circle 
            cx="20" cy="18" r="4" 
            fill="#06b6d4" 
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }}
          />
          {/* Digital segmented display value */}
          <text x="20" y="34" fill="#06b6d4" fontSize="8" fontWeight="900" fontFamily="monospace" textAnchor="middle" letterSpacing="0.5" opacity="0.85">120</text>
          {/* Click Sync bars */}
          <path d="M 4 18 L 9 18 M 31 18 L 36 18" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
        </svg>
      );
    case 'spl':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-0.5 select-none pointer-events-none">
          {/* Giant digital readout "72" exactly as in spl_meter.jpg */}
          <g>
            <text 
              x="16" y="22" 
              fill="#39FF14" fontSize="18" fontWeight="900" fontFamily="monospace" 
              textAnchor="middle" letterSpacing="-1"
            >
              72
            </text>
            <text x="29" y="20" fill="#475569" fontSize="5" fontWeight="900" fontFamily="sans-serif">DBA</text>
            
            {/* Horizontal scanlines layered on top of the digits */}
            <line x1="2" y1="10" x2="38" y2="10" stroke="#000000" strokeWidth="0.75" opacity="0.5" />
            <line x1="2" y1="13" x2="38" y2="13" stroke="#000000" strokeWidth="0.75" opacity="0.5" />
            <line x1="2" y1="16" x2="38" y2="16" stroke="#000000" strokeWidth="0.75" opacity="0.5" />
            <line x1="2" y1="19" x2="38" y2="19" stroke="#000000" strokeWidth="0.75" opacity="0.5" />
            <line x1="2" y1="22" x2="38" y2="22" stroke="#000000" strokeWidth="0.75" opacity="0.5" />
          </g>

          {/* Sleek level progress bar with smooth slow breathing (4.0s - no abrupt jumps) */}
          <line x1="4" y1="29" x2="36" y2="29" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <motion.line 
            x1="4" y1="29" x2="26" y2="29" 
            stroke="#39FF14" strokeWidth="1.5" strokeLinecap="round"
            initial={{ x2: 26 }}
            animate={{ x2: [22, 28, 24, 30, 23, 27, 22] }}
            transition={{ repeat: Infinity, duration: 4.0, ease: "easeInOut" }}
          />

          {/* Tiny technical description */}
          <text x="20" y="36" fill="#475569" fontSize="3" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.2">SPL INSTANTÁNEO</text>
        </svg>
      );
    case 'ir':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full p-0.5 select-none pointer-events-none">
          {/* Exponential decay envelope waveform */}
          <motion.path 
            d="M 4 20 L 6 9 L 8 31 L 11 13 L 14 27 L 18 16 L 22 24 L 26 17 L 30 22 L 34 19 L 38 20" 
            fill="none" stroke="#39FF14" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0.15 }}
            animate={{ pathLength: [0.15, 1] }}
            transition={{ repeat: Infinity, duration: 2.0, ease: "easeOut" }}
          />
          {/* Decay scale early reflection lines */}
          <line x1="6" y1="20" x2="6" y2="9" stroke="#39FF14" strokeWidth="0.5" opacity="0.25" />
          <line x1="8" y1="20" x2="8" y2="31" stroke="#39FF14" strokeWidth="0.5" opacity="0.25" />
          <line x1="11" y1="20" x2="11" y2="13" stroke="#39FF14" strokeWidth="0.5" opacity="0.15" />
          {/* White impulse spark flash */}
          <motion.circle 
            cx="4" cy="20" r="2" 
            fill="#ffffff" 
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: [1, 2.5, 1], opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1.0, ease: "easeOut" }}
          />
        </svg>
      );
    default:
      return null;
  }
});

// --- LANDING COMPONENTS ---
function SoundScienceSection({ onOpenArchive }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [history, setHistory] = useState([0]);
  const current = PROTAGONISTAS[index];
  const prevIdx = (index - 1 + PROTAGONISTAS.length) % PROTAGONISTAS.length;
  const nextIdx = (index + 1) % PROTAGONISTAS.length;

  const nextCard = () => {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * PROTAGONISTAS.length);
    } while (history.includes(nextIdx));
    
    setHistory(prev => {
      const newHistory = [...prev, nextIdx];
      if (newHistory.length > 7) newHistory.shift();
      return newHistory;
    });

    setDirection(nextIdx > index ? 1 : -1);
    setIndex(nextIdx);
    trackEvent('genealogy_card_change', { to: PROTAGONISTAS[nextIdx].id });
  };

  return (
    <section className="pt-2 pb-10 lg:pt-14 lg:pb-14 px-6 md:p-12 bg-transparent flex flex-col items-center justify-center relative border-b border-white/5 overflow-hidden text-white">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full glow-cyan rounded-full opacity-30" />
      </div>
      
      <div className="mb-16 text-center z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-500/80 font-black">Vostok Archivo Histórico</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-light tracking-tighter text-white uppercase leading-tight">
          La Genealogía del <br/><span className="font-black text-cyan-400">Sonido</span>
        </h2>
      </div>

      {/* MOBILE STACK CARDS VIEW (VERTICAL 3D REEL CAROUSEL) */}
      <div className="lg:hidden relative w-full max-w-sm h-[360px] z-10 mx-auto select-none overflow-visible">
        {PROTAGONISTAS.map((hito, hitoIndex) => {
          const N = PROTAGONISTAS.length;
          let diff = hitoIndex - index;
          if (diff > N / 2) diff -= N;
          if (diff < -N / 2) diff += N;

          return (
            <HitoCard 
              key={`mobile-${hito.id}`}
              hito={hito} 
              diff={diff} 
              isMobile={true} 
              onClick={() => {
                setDirection(1);
                setIndex(nextIdx);
                trackEvent('genealogy_card_change', { to: PROTAGONISTAS[nextIdx].id });
              }} 
              hitoIndex={hitoIndex} 
              totalHitos={N} 
            />
          );
        })}
      </div>

      {/* DESKTOP 3D CAROUSEL SENSORY SLIDER */}
      <div className="hidden lg:block relative w-full max-w-5xl h-[420px] z-10 select-none overflow-visible mx-auto">
        {PROTAGONISTAS.map((hito, hitoIndex) => {
          const N = PROTAGONISTAS.length;
          let diff = hitoIndex - index;
          if (diff > N / 2) diff -= N;
          if (diff < -N / 2) diff += N;

          return (
            <HitoCard 
              key={`desktop-${hito.id}`}
              hito={hito} 
              diff={diff} 
              isMobile={false} 
              onClick={() => {
                setDirection(1);
                setIndex(nextIdx);
                trackEvent('genealogy_card_change', { to: PROTAGONISTAS[nextIdx].id });
              }} 
              hitoIndex={hitoIndex} 
              totalHitos={N} 
            />
          );
        })}
      </div>

      <div className="mt-20 flex gap-3 z-10">
        {PROTAGONISTAS.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-10 bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'w-2 bg-white/10'}`} />
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenArchive}
        className="mt-10 px-10 py-4 bg-white/5 border border-cyan-500/20 rounded-full flex items-center gap-4 group transition-all hover:bg-cyan-500/10 hover:border-cyan-500/40 z-10"
      >
        <Activity className="w-5 h-5 text-cyan-400 group-hover:animate-pulse" />
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">Explorar Base de Datos</span>
          <span className="text-xs font-bold text-white uppercase tracking-widest">Audio Archive Databank</span>
        </div>
      </motion.button>
    </section>
  );
}

// --- NEW BLOG PREVIEW SECTION ---
function BlogPreviewSection({ onOpenPost }) {
  const PREVIEW_POSTS = [
    {
      id: "post-alternate-tunings-deep-dive",
      title: "Afinaciones Alternativas: Explorando la Geometría del Tono",
      date: "20-05-2026",
      category: "Recursos Músicos",
      readTime: "7 MIN",
      excerpt: "Desbloquea nuevas sonoridades y optimiza la física de tus cuerdas para dominar el mástil más allá del estándar."
    },
    {
      id: "post-scale-sensor-guide",
      title: "Scale Sensor: El Método de Privación Sensorial",
      date: "20-05-2026",
      category: "Entrenamiento",
      readTime: "6 MIN",
      excerpt: "Entrena tu oído relativo y memoria muscular eliminando las muletas visuales con el Dark Practice Node."
    },
    {
      id: "post-radar-guide",
      title: "Harmonic Radar: Interpretando la Gravedad Tonal",
      date: "20-05-2026",
      category: "Teoría Armónica",
      readTime: "5 MIN",
      excerpt: "Aprende a leer el Círculo de Quintas dinámico para identificar tonalidades y modos en cualquier grabación."
    }
  ];

  return (
    <section className="py-8 lg:py-12 px-6 md:px-12 bg-transparent flex flex-col items-center justify-center relative border-b border-white/5 overflow-hidden text-white w-full">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute bottom-0 right-1/4 w-[60vw] h-[60vw] glow-purple rounded-full opacity-30" />
      </div>

      <div className="max-w-6xl w-full z-10 flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] shadow-[0_0_6px_#39FF14] animate-pulse" />
            <span className="text-[7.5px] font-black uppercase tracking-[0.3em] text-[#39FF14] font-mono">
              Bitácora de Campo // Vostok Journal
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 font-mono leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500">
            Lab Notes & Investigación
          </h2>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
            Explora las bases científicas, acústicas y matemáticas detrás del ecosistema de herramientas de Vostok Labs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mb-8">
          {PREVIEW_POSTS.map((post) => (
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.15 }}
              key={post.id}
              onClick={() => onOpenPost(post.id)}
              className="bg-white/[0.01] border border-white/5 hover:border-[#39FF14]/25 hover:bg-white/[0.03] transition-all rounded-3xl p-5 flex flex-col group cursor-pointer shadow-lg relative overflow-hidden h-fit w-full"
            >
              {/* Subtle card glow */}
              <div className="absolute -inset-px bg-gradient-to-r from-[#39FF14]/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div>
                <span className="text-[6.5px] text-[#39FF14] tracking-widest font-mono border border-[#39FF14]/25 px-2 py-0.5 rounded-full uppercase bg-[#39FF14]/5 mb-3 inline-block">
                  {post.category}
                </span>
                <h3 className="text-xs font-black text-white group-hover:text-[#39FF14] transition-colors leading-snug mb-1.5 font-mono uppercase tracking-tight line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <div className="flex gap-2.5 text-[7.5px] text-slate-500 font-mono">
                  <span>{post.date}</span>
                  <span className="text-slate-700">//</span>
                  <span>{post.readTime}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#39FF14] group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => onOpenPost(null)}
          className="px-5 py-2.5 bg-white/[0.02] border border-white/10 hover:border-[#39FF14]/30 rounded-full text-[8.5px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:shadow-[0_0_15px_rgba(57,255,20,0.1)] transition-all flex items-center gap-2 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#39FF14]" />
          <span>Explorar todos los registros</span>
        </button>
      </div>
    </section>
  );
}

// --- LAZY SECTION WRAPPERS ---
// Estas funciones envuelven las secciones del scroll en un IntersectionObserver.
// El componente real NO se monta hasta que el usuario se acerca al área,
// por lo tanto ninguna de sus animaciones de Framer Motion corre en el initial load.
function LazySoundScienceSection({ onOpenArchive }) {
  const { shouldRender, placeholderRef } = useLazySection('300px');
  if (!shouldRender) {
    return <div ref={placeholderRef} style={{ minHeight: '600px' }} />;
  }
  return <SoundScienceSection onOpenArchive={onOpenArchive} />;
}

function LazyBlogPreviewSection({ onOpenPost }) {
  const { shouldRender, placeholderRef } = useLazySection('200px');
  if (!shouldRender) {
    return <div ref={placeholderRef} style={{ minHeight: '400px' }} />;
  }
  return <BlogPreviewSection onOpenPost={onOpenPost} />;
}

export default function App() {
  const [view, setView] = useState('home');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoType, setInfoType] = useState('faq');
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [systemErrors, setSystemErrors] = useState([]);
  const [showDiagnosticConsole, setShowDiagnosticConsole] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const [selectedToolDesc, setSelectedToolDesc] = useState(null);
  const [hoveredToolKey, setHoveredToolKey] = useState(null);
  const [initialBlogPostId, setInitialBlogPostId] = useState(null);

  const TOOL_REGISTRY = {
    scales: {
      key: "scales",
      title: "Scale Sensor",
      color: "#39FF14",
      icon: Music,
      desc: "Diseñado para que los músicos practiquen escalas. Evalúa en tiempo real si la escala seleccionada se tocó de forma correcta.",
      tag: "SCALE_SENSOR // METROLOGÍA",
      view: "scales"
    },
    radar: {
      key: "radar",
      title: "Harmonic Radar",
      color: "#39FF14",
      icon: Waves,
      desc: "Escucha una canción y detecta su escala principal analizando y comparando las notas musicales para determinar su espacio tonal. Entre más tiempo analice, más certero es el veredicto.",
      tag: "RADAR_WAVES // DISPERSIÓN",
      view: "radar"
    },
    spectrum: {
      key: "spectrum",
      title: "Spectrum",
      color: "#A855F7",
      icon: Waves,
      desc: "Analizador en tiempo real (RTA) y espectrógrafo. Sirve para detectar acoples (feedbacks), analizar la respuesta frecuencial de una sala u otros usos creativos de audio.",
      tag: "SPECTRUM_SCOPE // FFT_DSP",
      view: "spectrum"
    },
    tempo: {
      key: "tempo",
      title: "Tempo Detector",
      color: "#06b6d4",
      icon: Zap,
      desc: "Herramienta con botón de Tap Tempo que se va ajustando a medida que lo presionas. Una vez sincronizado, puedes activar un metrónomo perfectamente adaptado al ritmo.",
      tag: "TEMPO_BPM // TRANSIENT",
      view: "tempo"
    },
    spl: {
      key: "spl",
      title: "SPL Meter",
      color: "#fbbf24",
      icon: Volume2,
      desc: "Analiza con precisión los niveles de presión sonora (volumen físico) ambiental en tiempo real.",
      tag: "METROLOGY_DBA // PRESIÓN",
      view: "spl"
    },
    ir: {
      key: "ir",
      title: "Impulse Response",
      color: "#39FF14",
      icon: Activity,
      desc: "Genera un barrido de frecuencia y graba la respuesta del micrófono, entregando un gráfico detallado de cómo se comporta la acústica en tu sala.",
      tag: "IMPULSE_IR // ACÚSTICA",
      view: "ir"
    }
  };

  const openToolInfo = (toolKey) => {
    setSelectedToolDesc(TOOL_REGISTRY[toolKey]);
  };

  const handleSecretTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    
    if (tapCountRef.current >= 5) {
      setShowDiagnosticConsole(prev => !prev);
      tapCountRef.current = 0;
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 1500); 
    }
  };

  const { canInstall, canShowMobile, installApp, isInstalled } = usePWAInstall();
  const isIOS = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  const viewRef = useRef(view);
  useEffect(() => { 
    viewRef.current = view;
    if (view === 'home') {
      window.history.pushState(null, '', window.location.pathname);
    } else {
      window.history.pushState({ view }, '', window.location.pathname);
    }
  }, [view]);

  useEffect(() => {
    const backButtonHandler = CapacitorApp.addListener('backButton', () => {
      if (viewRef.current !== 'home') {
        setView('home');
      } else {
        CapacitorApp.exitApp();
      }
    });

    const handlePopState = (e) => {
      if (viewRef.current !== 'home') {
        setView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      backButtonHandler.then(h => h.remove());
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const reportError = useCallback((message, type = 'WARNING') => {
    const id = Date.now();
    setSystemErrors(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setSystemErrors(prev => prev.filter(e => e.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    initAnalytics();
    const handleGlobalError = (event) => {
      reportError(event.message || 'Error de ejecución detectado', 'CRITICAL');
    };
    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, [reportError]);

  const handleInfoClick = useCallback((type) => {
    trackEvent('info_modal_open', { type });
    setInfoType(type);
    setShowInfoModal(true);
  }, []);

  const handleSetView = (v) => {
    trackEvent('view_change', { to: v });
    setView(v);
  };

  const handleInstall = () => {
    trackEvent('pwa_install_click');
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      installApp();
    }
  };

  return (
    <div className="min-h-screen bg-[#010101] crt-scanlines text-white font-sans selection:bg-[#39FF14]/30 overflow-x-hidden grid-bg">
      <AnimatePresence>
        {systemErrors.length > 0 && <SystemHealth errors={systemErrors} />}
      </AnimatePresence>
      
      {view === 'tuner' && <VostokTuner onBack={() => setView('home')} />}
      {view === 'tuner-bridge' && <VostokTuner onBack={() => setView('scales')} />}
      {view === 'spectrum' && <SpectrumAnalyzer onBack={() => setView('home')} />}
      {view === 'spl' && <SPLMeter onBack={() => setView('home')} />}
      {view === 'scales' && (
        <Suspense fallback={<div className="fixed inset-0 bg-black z-[100] flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping" /></div>}>
          <ScaleSensor 
            onBack={() => setView('home')} 
            onOpenTuner={() => setView('tuner-bridge')}
          />
        </Suspense>
      )}
      {view === 'tempo' && (
        <TempoSense 
          onBack={() => setView('home')} 
          onOpenRadar={() => setView('radar')}
        />
      )}
      {view === 'radar' && (
        <Suspense fallback={<div className="fixed inset-0 bg-black z-[100] flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping" /></div>}>
          <HarmonicRadar onBack={() => setView('home')} />
        </Suspense>
      )}
      {view === 'audioarchive' && <AudioArchive onClose={() => setView('home')} />}
      {view === 'blog' && (
        <ExperimentBlog 
          onBack={() => {
            setInitialBlogPostId(null);
            setView('home');
          }} 
          initialPostId={initialBlogPostId} 
        />
      )}
      {view === 'ir' && (
        <Suspense fallback={<div className="fixed inset-0 bg-black z-[100] flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping" /></div>}>
          <ImpulseResponse onBack={() => setView('home')} />
        </Suspense>
      )}

      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} type={infoType} />
      <AudioSettingsModal isOpen={showAudioSettings} onClose={() => setShowAudioSettings(false)} />

      <AnimatePresence>
        {showIOSGuide && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setShowIOSGuide(false)}
          >
            <div className="max-w-xs w-full bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] text-center shadow-2xl">
              <VostokLogo className="w-16 h-16 mx-auto mb-8" />
              <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">Instalar Vostok</h3>
              <p className="text-slate-400 text-sm font-bold mb-8 leading-relaxed">Pulsa el botón "Compartir" de Safari y elige "Añadir a la pantalla de inicio".</p>
              <button className="w-full py-4 bg-[#39FF14] text-black rounded-full text-[10px] font-black uppercase tracking-widest">Entendido</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-[-10%] right-[-10%] w-[120vw] h-[120vw] glow-purple rounded-full will-change-transform" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 18, repeat: Infinity, delay: 2 }}
          className="absolute bottom-[-10%] left-[-10%] w-[100vw] h-[100vw] glow-green rounded-full will-change-transform" 
        />
      </div>

      {view === 'home' && (
        <>
          <nav className="fixed top-0 w-full z-40 px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center bg-black/85 backdrop-blur-md border-b border-white/5 pt-[max(1.2rem,env(safe-area-inset-top))]" style={{ WebkitBackdropFilter: 'blur(16px)' }}>
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleSecretTap}>
              <VostokLogo className="w-9 h-9 sm:w-10 sm:h-10" />
              <div className="flex flex-col text-left">
                <span className="font-mono text-xs sm:text-sm font-black tracking-[0.25em] text-white uppercase leading-none">VOSTOK</span>
                <span className="font-mono text-[7px] sm:text-[8px] font-bold tracking-[0.35em] text-cyan-400/80 uppercase leading-none mt-1">LABS // V1.1.0</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => handleSetView('blog')} 
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-[#39FF14]/10 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2.5 text-[#39FF14]"
              >
                <Terminal className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>Blog</span>
              </button>
              <button 
                onClick={() => setShowAudioSettings(true)}
                aria-label="Configuración de Audio"
                className="p-1.5 sm:p-2.5 px-3 sm:px-4 bg-white/5 border border-white/10 text-slate-400 rounded-full hover:bg-white/10 hover:text-white active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 justify-center cursor-pointer"
              >
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase">I/O</span>
                <div className="flex gap-0.5 items-end h-2.5 sm:h-3">
                  <span className="w-0.5 h-1 sm:h-1.5 rounded-sm bg-[#39FF14] opacity-50 animate-[pulse_1s_infinite_alternate]" />
                  <span className="w-0.5 h-2.5 sm:h-3 rounded-sm bg-[#39FF14] opacity-80 animate-[pulse_0.8s_infinite_alternate_0.2s]" />
                  <span className="w-0.5 h-1.5 sm:h-2 rounded-sm bg-[#39FF14] opacity-60 animate-[pulse_1.2s_infinite_alternate_0.1s]" />
                </div>
              </button>
              {!isInstalled && (canInstall || canShowMobile) && (
                <button 
                  onClick={handleInstall} 
                  aria-label="Descargar aplicación"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-[#39FF14]/20 active:scale-95 transition-all"
                >
                  Instalar
                </button>
              )}
            </div>
          </nav>

          {/* TECHNICAL TELEMETRY BAR */}
          <div className="fixed top-[68px] lg:top-[81px] left-0 w-full z-30 bg-black/45 border-b border-white/[0.03] py-1.5 px-4 sm:px-8 flex items-center justify-center gap-3 sm:gap-6 lg:gap-8 text-[8px] sm:text-[9px] font-mono tracking-[0.2em] text-slate-500 select-none backdrop-blur-md overflow-x-auto whitespace-nowrap" style={{ WebkitBackdropFilter: 'blur(12px)', scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-1 h-1 rounded-full bg-[#39FF14] shadow-[0_0_4px_#39FF14] animate-[pulse_1s_infinite_alternate]" />
              <span>DSP <span className="hidden sm:inline">ENGINE</span>: <span className="text-white/70">ACTIVE<span className="hidden md:inline"> (ZERO-COPY)</span></span></span>
            </div>
            
            <span className="opacity-30 shrink-0 hidden sm:inline">|</span>
            <span className="shrink-0 hidden sm:inline">SR: <span className="text-white/70">48.0 KHZ</span></span>
            
            <span className="opacity-30 shrink-0 hidden md:inline">|</span>
            <span className="shrink-0 hidden md:inline">BUF: <span className="text-white/70">512 SAMPLES</span></span>
            
            <span className="opacity-30 shrink-0">|</span>
            <span className="shrink-0">LATENCY: <span className="text-white/70">~10.7 MS</span></span>
            
            <span className="opacity-30 shrink-0">|</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-1 h-1 rounded-full bg-[#39FF14] shadow-[0_0_4px_#39FF14] animate-[pulse_1s_infinite_alternate]" />
              <span>SYS <span className="hidden sm:inline">HEALTH</span>: <span className="text-[#39FF14]/80 font-black">NOMINAL</span></span>
            </div>
            
            <span className="opacity-30 shrink-0 hidden md:inline">|</span>
            <span className="shrink-0 hidden md:inline">FPS: <span className="text-white/70">60.0</span></span>
            
            <span className="opacity-30 shrink-0 hidden lg:inline">|</span>
            <span className="shrink-0 hidden lg:inline">MODE: <span className="text-white/70">LOCAL-FIRST</span></span>
          </div>

          <section className="min-h-fit lg:min-h-screen flex flex-col items-center justify-start px-8 text-center relative pt-28 lg:pt-32 pb-4 z-10">
            <div className="max-w-6xl w-full mx-auto flex flex-col lg:flex-row items-center justify-between lg:flex-grow py-2 lg:py-6 gap-3 lg:gap-6">
              {/* LEFT RACK: AFINACIÓN & ANÁLISIS ARMÓNICO */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:flex flex-col justify-between text-left w-64 shrink-0 self-stretch min-h-[420px]">
                <div className="flex flex-col gap-5">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono border-b border-white/5 pb-2 mb-1.5 select-none">
                    Afinación & Análisis Armónico
                  </div>
                  {[
                    { key: "scales", t: "Scale Sensor", c: "#39FF14", i: Music, action: () => openToolInfo('scales') },
                    { key: "radar", t: "Harmonic Radar", c: "#39FF14", i: Waves, action: () => openToolInfo('radar') },
                    { key: "spectrum", t: "Spectrum", c: "#A855F7", i: Waves, action: () => openToolInfo('spectrum') },
                  ].map((tool, idx) => {
                    const Icon = tool.i;
                    const baseX = idx === 1 ? 36 : idx === 2 ? 84 : 0;
                    return (
                      <div className="relative w-full" key={idx}>
                        <motion.button 
                          animate={{ x: baseX }}
                          whileHover={{ x: baseX + 6 }} 
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          onMouseEnter={() => setHoveredToolKey(tool.key)}
                          onMouseLeave={() => setHoveredToolKey(null)}
                          onClick={tool.action}
                          className="w-full text-left p-1 rounded-xl transition-all flex items-center justify-end gap-3 group cursor-pointer relative"
                        >
                          <div className="flex flex-col justify-center h-12 overflow-hidden text-right">
                            <span className="text-[11px] font-black uppercase text-white/80 tracking-widest group-hover:text-[#39FF14] transition-colors font-mono">{tool.t}</span>
                          </div>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 transition-all shrink-0 bg-[#060606] overflow-hidden relative group-hover:border-[#39FF14]/50 group-hover:shadow-[0_0_12px_rgba(57,255,20,0.2)] group-hover:scale-105" style={{ borderColor: `${tool.c}20` }}>
                            <ToolMiniScreen toolKey={tool.key} />
                          </div>
                        </motion.button>
                      </div>
                    );
                  })}
                </div>

                {/* BOTTOM LEFT CORNER HUD INSPECTOR */}
                <div className="min-h-[120px] flex items-end mt-4">
                  <AnimatePresence mode="wait">
                    {hoveredToolKey && ['scales', 'radar', 'spectrum'].includes(hoveredToolKey) && (
                      <motion.div 
                        key={hoveredToolKey}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="w-full p-4 rounded-2xl bg-black/90 border border-[#39FF14]/30 backdrop-blur-2xl shadow-[0_0_30px_rgba(57,255,20,0.12)] pointer-events-none text-left"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TOOL_REGISTRY[hoveredToolKey].color, boxShadow: `0 0 8px ${TOOL_REGISTRY[hoveredToolKey].color}` }} />
                          <span className="text-[9px] font-black uppercase tracking-widest font-mono" style={{ color: TOOL_REGISTRY[hoveredToolKey].color }}>
                            {TOOL_REGISTRY[hoveredToolKey].tag}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed font-sans">
                          {TOOL_REGISTRY[hoveredToolKey].desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* CENTRAL RACK: LOGO & FLAGSHIP TUNER */}
              <div className="max-w-xl flex flex-col items-center justify-center lg:flex-1 py-2 w-full lg:scale-[0.95] lg:translate-y-5 lg:origin-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.92 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: 0.05, duration: 0.4 }} 
                  className="mb-4 flex justify-center"
                >
                  <VostokLogo className="w-12 h-12 lg:w-16 lg:h-16 text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.35)]" />
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-6xl lg:text-[5.5rem] tracking-tighter leading-[0.9] mb-5 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 uppercase flex items-center justify-center gap-1.5 sm:gap-3 select-none">
                  <span className="font-black">Vostok</span>
                  <span className="font-light text-white/30">Labs</span>
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-xs md:text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed tracking-tight">
                  Herramientas gratuitas de alto nivel para el uso diario del músico y el profesional del sonido.
                </motion.p>
                <div className="flex flex-row justify-center w-auto mt-6 lg:mt-16 mb-6">
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleSetView('tuner')} 
                    aria-label="Abrir Afinador Vostok"
                    className="px-8 py-3.5 bg-[#060606] border border-white/10 text-white rounded-xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:border-[#39FF14]/40 transition-all flex items-center justify-center gap-3 group will-change-transform cursor-pointer"
                    style={{ WebkitBackdropFilter: 'blur(20px)' }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center border bg-[#030303] overflow-hidden relative border-white/10 group-hover:border-[#39FF14]/35 shrink-0">
                      <ToolMiniScreen toolKey="tuner" />
                    </div>
                    <div className="text-lg lg:text-xl leading-none uppercase tracking-tighter flex items-center">
                      <span className="font-black">Vostok</span>
                      <span className="font-light opacity-70 ml-1">Tuner</span>
                    </div>
                  </motion.button>
                </div>

                {/* --- STUDIO CONTROL RACK (ONLY VISIBLE ON MOBILE & TABLET) --- */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:hidden w-full max-w-md mx-auto flex flex-col items-center bg-white/[0.02] border border-white/5 p-4 rounded-[1.5rem] backdrop-blur-xl shadow-2xl mb-8"
                >
                  <div className="flex items-center gap-2 mb-3.5 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14] animate-[pulse_1s_infinite_alternate]" />
                    <span className="text-[7.5px] font-black uppercase tracking-[0.3em] text-slate-500 font-mono">
                      Consola de Medición — Studio Rack
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 w-full">
                    {[
                      { t: "Scale Sensor", c: "#39FF14", i: Music, d: "Práctica de escalas", action: () => openToolInfo('scales') },
                      { t: "Harmonic Radar", c: "#39FF14", i: Waves, d: "Encuentra la escala", action: () => openToolInfo('radar') },
                      { t: "Tempo Detector", c: "#06b6d4", i: Zap, d: "Tap tempo y metrónomo", action: () => openToolInfo('tempo') },
                      { t: "Spectrum", c: "#A855F7", i: Waves, d: "RTA y espectrógrafo", action: () => openToolInfo('spectrum') },
                      { t: "SPL Meter", c: "#fbbf24", i: Volume2, d: "Presión sonora dBA", action: () => openToolInfo('spl') },
                      { t: "Impulse Resp.", c: "#39FF14", i: Activity, d: "Acústica de tu sala", action: () => openToolInfo('ir') },
                    ].map((app, i) => {
                      const Icon = app.i;
                      return (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={i} onClick={app.action}
                          aria-label={`Abrir Vostok ${app.t}`}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/60 border border-white/5 active:border-[#39FF14]/20 transition-all text-left group relative overflow-hidden cursor-pointer"
                        >
                          <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full" style={{ backgroundColor: app.c, boxShadow: `0 0 4px ${app.c}` }} />
                          <div className="w-7 h-7 rounded-md flex items-center justify-center border transition-all shrink-0" style={{ backgroundColor: `${app.c}10`, borderColor: `${app.c}15` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: app.c }} />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[9px] tracking-wide uppercase font-black text-white group-hover:text-[#39FF14] transition-colors font-mono">{app.t}</span>
                            <span className="text-[7px] text-slate-500 font-mono truncate">{app.d}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* RIGHT RACK: TIEMPO, VOLUMEN & ACÚSTICA */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:flex flex-col justify-between text-right w-64 shrink-0 items-end self-stretch min-h-[420px]">
                <div className="flex flex-col gap-5 w-full items-end">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono border-b border-white/5 pb-2 mb-1.5 w-full select-none text-right">
                    Tiempo, Volumen & Acústica
                  </div>
                  {[
                    { key: "tempo", t: "Tempo Detector", c: "#06b6d4", i: Zap, action: () => openToolInfo('tempo') },
                    { key: "spl", t: "SPL Meter", c: "#fbbf24", i: Volume2, action: () => openToolInfo('spl') },
                    { key: "ir", t: "Impulse Response", c: "#39FF14", i: Activity, action: () => openToolInfo('ir') },
                  ].map((tool, idx) => {
                    const Icon = tool.i;
                    const baseX = idx === 1 ? -36 : idx === 2 ? -84 : 0;
                    return (
                      <div className="relative w-full" key={idx}>
                        <motion.button 
                          animate={{ x: baseX }}
                          whileHover={{ x: baseX - 6 }} 
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          onMouseEnter={() => setHoveredToolKey(tool.key)}
                          onMouseLeave={() => setHoveredToolKey(null)}
                          onClick={tool.action}
                          className="w-full text-right p-1 rounded-xl transition-all flex items-center justify-start gap-3 group cursor-pointer relative"
                        >
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 transition-all shrink-0 bg-[#060606] overflow-hidden relative group-hover:border-[#39FF14]/50 group-hover:shadow-[0_0_12px_rgba(57,255,20,0.2)] group-hover:scale-105" style={{ borderColor: `${tool.c}20` }}>
                            <ToolMiniScreen toolKey={tool.key} />
                          </div>
                          <div className="flex flex-col justify-center h-12 overflow-hidden items-start text-left">
                            <span className="text-[11px] font-black uppercase text-white/80 tracking-widest group-hover:text-[#39FF14] transition-colors font-mono">{tool.t}</span>
                          </div>
                        </motion.button>
                      </div>
                    );
                  })}
                </div>

                {/* BOTTOM RIGHT CORNER HUD INSPECTOR */}
                <div className="min-h-[120px] flex items-end mt-4 w-full">
                  <AnimatePresence mode="wait">
                    {hoveredToolKey && ['tempo', 'spl', 'ir'].includes(hoveredToolKey) && (
                      <motion.div 
                        key={hoveredToolKey}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="w-full p-4 rounded-2xl bg-black/90 border border-[#39FF14]/30 backdrop-blur-2xl shadow-[0_0_30px_rgba(57,255,20,0.12)] pointer-events-none text-right"
                      >
                        <div className="flex items-center gap-2 mb-1.5 justify-end">
                          <span className="text-[9px] font-black uppercase tracking-widest font-mono" style={{ color: TOOL_REGISTRY[hoveredToolKey].color }}>
                            {TOOL_REGISTRY[hoveredToolKey].tag}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TOOL_REGISTRY[hoveredToolKey].color, boxShadow: `0 0 8px ${TOOL_REGISTRY[hoveredToolKey].color}` }} />
                        </div>
                        <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed font-sans text-right">
                          {TOOL_REGISTRY[hoveredToolKey].desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }} className="flex flex-col items-center pointer-events-none mt-1 lg:mt-6 mb-2">
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#39FF14] mb-1.5 drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">Sigue el pulso</span>
              <div className="relative h-6 w-[1px] bg-white/10 overflow-hidden">
                <motion.div animate={{ y: [-24, 24], opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-[#39FF14] to-transparent shadow-[0_0_8px_#39FF14]" />
              </div>
              <ChevronDown className="w-4 h-4 text-[#39FF14] mt-1 drop-shadow-[0_0_5px_rgba(57,255,20,0.8)] animate-bounce" />
            </motion.div>
          </section>

          <LazySoundScienceSection onOpenArchive={() => handleSetView('audioarchive')} />

          <LazyBlogPreviewSection onOpenPost={(postId) => {
            setInitialBlogPostId(postId);
            setView('blog');
          }} />

          <Footer onInfoClick={handleInfoClick} />
        </>
      )}

      <AnimatePresence>
        {showDiagnosticConsole && <DiagnosticConsole onClose={() => setShowDiagnosticConsole(false)} currentView={view} />}
      </AnimatePresence>

      <AnimatePresence>
        {selectedToolDesc && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              className="max-w-xs w-full bg-[#0a0a0a] border border-white/10 p-8 rounded-[2.5rem] relative shadow-2xl flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute -top-24 w-48 h-48 rounded-full filter blur-[60px] opacity-15 pointer-events-none" style={{ backgroundColor: selectedToolDesc.color }} />

              <div className="w-16 h-16 rounded-2xl flex items-center justify-center border mb-6 relative z-10 shrink-0" style={{ backgroundColor: `${selectedToolDesc.color}10`, borderColor: `${selectedToolDesc.color}20` }}>
                <selectedToolDesc.icon className="w-7 h-7" style={{ color: selectedToolDesc.color }} />
              </div>

              <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-2 select-none font-bold">{selectedToolDesc.tag}</span>

              <h3 className="text-xl font-black uppercase tracking-tight text-white mb-4">
                {selectedToolDesc.title}
              </h3>

              <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8">
                {selectedToolDesc.desc}
              </p>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setSelectedToolDesc(null)}
                  className="flex-1 py-4 rounded-full border border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                >
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    const viewToOpen = selectedToolDesc.view;
                    setSelectedToolDesc(null);
                    handleSetView(viewToOpen);
                  }}
                  className="flex-1 py-4 rounded-full text-black text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:brightness-110 cursor-pointer font-bold"
                  style={{ 
                    backgroundColor: selectedToolDesc.color,
                    boxShadow: `0 0 15px ${selectedToolDesc.color}30` 
                  }}
                >
                  Abrir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
