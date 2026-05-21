import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { 
  Activity, Check, Settings, Upload, Waves, X, ChevronRight, 
  Smartphone, LayoutGrid, Plus, Minus, ArrowLeft, 
  Music, Zap, Send, ChevronDown, Volume2, Terminal
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

// --- LANDING COMPONENTS ---
function SoundScienceSection({ onOpenArchive }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [history, setHistory] = useState([0]);
  const current = PROTAGONISTAS[index];

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
    <section className="py-32 px-6 md:p-12 bg-[#050505] flex flex-col items-center justify-center relative border-y border-white/5 overflow-hidden text-white">
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

      <div className="relative w-full max-w-xl z-10 perspective-1000 mx-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: direction * 50, rotateY: direction * 10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -direction * 50, rotateY: -direction * 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={nextCard}
            className="cursor-pointer group relative z-10"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[#080808] border border-white/5 rounded-[2.5rem] transform translate-y-4 scale-[0.95] -z-10 transition-transform duration-500 group-hover:translate-y-5 group-hover:scale-[0.94]" />
            <div className="absolute top-0 left-0 w-full h-full bg-[#050505] border border-white/5 rounded-[2.5rem] transform translate-y-8 scale-[0.90] -z-20 transition-transform duration-500 group-hover:translate-y-10 group-hover:scale-[0.88]" />

            <div className="relative z-20 bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden transition-all duration-500 group-hover:border-cyan-500/30">
              <div className="absolute right-[-40px] top-[-40px] w-64 h-64 pointer-events-none opacity-20 md:opacity-30 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
                <GraphicIcon type={current.grafico} color={current.color} />
              </div>
              <div className="relative flex flex-col h-full min-h-[360px] justify-between z-10">
                <div>
                  <div className="flex items-start justify-between mb-10">
                    <div>
                      <h2 className="text-[10px] font-mono text-cyan-500 mb-2 tracking-[0.3em] font-black uppercase opacity-60">HITOS_TECNOLÓGICOS</h2>
                      <div className="text-4xl font-black text-white tracking-tighter leading-none uppercase">
                        {current.nombre}
                      </div>
                    </div>
                    <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-colors">
                      <ChevronRight className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                  <div className="mb-8">
                    <span className="inline-block px-4 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6">
                      {current.titulo}
                    </span>
                    <p className="text-lg text-slate-300 leading-relaxed font-light pl-6 border-l-2 border-cyan-500/20">
                      {current.descripcion}
                    </p>
                  </div>
                </div>
                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex gap-8">
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-widest text-slate-600 font-bold mb-1">Origen</span>
                      <span className="text-[11px] font-mono text-cyan-400 uppercase font-black tracking-wider">Archivo_Vostok</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-widest text-slate-600 font-bold mb-1">Hito</span>
                      <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">{index + 1} / {PROTAGONISTAS.length}</span>
                    </div>
                  </div>
                  <div className="h-6 w-20 opacity-30">
                     <svg viewBox="0 0 100 20" className="w-full h-full"><path d="M0 10 L10 10 L15 2 L25 18 L30 10 L100 10" stroke={current.color} fill="none" strokeWidth="1.5" /></svg>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center, ${current.color}05 0%, transparent 70%)` }} />
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[9px] font-mono tracking-widest text-cyan-500 uppercase font-black">
              Click para explorar otro hito
            </div>
          </motion.div>
        </AnimatePresence>
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
        className="mt-16 px-10 py-4 bg-white/5 border border-cyan-500/20 rounded-full flex items-center gap-4 group transition-all hover:bg-cyan-500/10 hover:border-cyan-500/40 z-10"
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

export default function App() {
  const [view, setView] = useState('home');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoType, setInfoType] = useState('faq');
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [systemErrors, setSystemErrors] = useState([]);
  const [showDiagnosticConsole, setShowDiagnosticConsole] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

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
      {view === 'blog' && <ExperimentBlog onBack={() => setView('home')} />}
      {view === 'ir' && (
        <Suspense fallback={<div className="fixed inset-0 bg-black z-[100] flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping" /></div>}>
          <ImpulseResponse onBack={() => setView('home')} />
        </Suspense>
      )}

      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} type={infoType} />

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
          <nav className="fixed top-0 w-full z-40 px-8 py-6 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-white/5 pt-[max(1.5rem,env(safe-area-inset-top))]" style={{ WebkitBackdropFilter: 'blur(16px)' }}>
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleSecretTap}>
              <VostokLogo className="w-10 h-10" />
              <span className="text-xl tracking-tight uppercase tracking-widest flex items-center">
                <span className="font-black">Vostok</span>
                <span className="font-light opacity-60">Labs</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleSetView('blog')} 
                className="px-6 py-2.5 bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#39FF14]/10 active:scale-95 transition-all flex items-center gap-2.5 text-[#39FF14]"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Blog</span>
              </button>
              {!isInstalled && (canInstall || canShowMobile) && (
                <button 
                  onClick={handleInstall} 
                  aria-label="Descargar aplicación"
                  className="hidden sm:flex px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
                >
                  Instalar App
                </button>
              )}
            </div>
          </nav>

          <section className="min-h-screen flex flex-col items-center justify-start px-8 text-center relative pt-24 pb-8 z-10">
            <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row items-center justify-between flex-grow py-12">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:flex flex-col gap-10 text-left w-64">
                <div className="space-y-1">
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 font-mono">System_Health</div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-white uppercase font-black tracking-widest">Core_Active</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">Latency: 2.4ms</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 border-l-2 border-white/5 pl-6">
                  <div>
                    <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 font-mono">Sample_Rate</div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">48.0 KHz / 24-Bit</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 font-mono">Buffer_Size</div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">4096 Samples</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 font-mono">FFT_Window</div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">Blackman-Harris</div>
                  </div>
                </div>
                <div className="pt-6">
                  <div className="text-[8px] font-black text-slate-800 uppercase tracking-[0.5em] mb-4 font-mono">Grid_Reference</div>
                  <svg viewBox="0 0 100 20" className="w-32 opacity-20"><path d="M0 10 H100 M10 5 V15 M30 5 V15 M50 0 V20 M70 5 V15 M90 5 V15" stroke="currentColor" fill="none" strokeWidth="0.5" /></svg>
                </div>
              </motion.div>

              <div className="max-w-3xl flex flex-col items-center justify-center">
                {canShowMobile && (
                  <button onClick={handleInstall} className="sm:hidden mb-6 px-6 py-3 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] rounded-full text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all">
                    Instalar App
                  </button>
                )}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mb-6">
                  Analog Audio Laboratory
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 uppercase">
                  Redefiniendo el <br/> Audio Digital
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-sm md:text-lg text-slate-400 max-w-xl mx-auto mb-12 leading-relaxed tracking-tight">
                  Herramientas de grado de estudio con interfaces táctiles diseñadas para la creación musical precisa.
                </motion.p>
                <div className="flex flex-row flex-wrap gap-4 justify-center w-full sm:w-auto mb-16">
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleSetView('tuner')} 
                    aria-label="Abrir Afinador Vostok"
                    className="flex-1 sm:flex-none px-8 sm:px-10 py-4 bg-white/5 border border-purple-500/30 text-white rounded-full backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.1)] hover:border-purple-500/60 transition-all flex items-center justify-center gap-3 group will-change-transform"
                    style={{ WebkitBackdropFilter: 'blur(20px)' }}
                  >
                    <TuningForkIcon className="w-6 h-6 text-[#39FF14] group-hover:scale-110 transition-transform" />
                    <div className="text-xl lg:text-2xl leading-none uppercase tracking-tighter flex items-center">
                      <span className="font-black">Vostok</span>
                      <span className="font-light opacity-70 ml-1">Tuner</span>
                    </div>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('herramientas')?.scrollIntoView({behavior: 'smooth'})} 
                    aria-label="Ver más herramientas"
                    className="flex-1 sm:flex-none px-8 sm:px-10 py-4 bg-white/5 border border-white/10 text-white rounded-full font-black text-sm hover:bg-white/10 transition-all uppercase tracking-widest backdrop-blur-md flex items-center justify-center shadow-lg"
                    style={{ WebkitBackdropFilter: 'blur(20px)' }}
                  >
                    Más herramientas
                  </motion.button>
                </div>
              </div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:flex flex-col gap-10 text-right w-64 items-end">
                <div className="space-y-1">
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 font-mono">Engine_Telemetry</div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-md">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-black tracking-widest">DSP_STABLE</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">Jitter: 0.02ms</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" />
                  </div>
                </div>
                <div className="space-y-4 border-r-2 border-white/5 pr-6">
                  <div>
                    <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 font-mono">Processor</div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">Web_Audio_V2</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 font-mono">Visual_Render</div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">Canvas_Hardware_Accel</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1 font-mono">Build_Stamp</div>
                    <div className="text-[11px] font-mono text-slate-500 uppercase font-bold tracking-wider">2026.05.08_PRO</div>
                  </div>
                </div>
                <div className="pt-6 flex flex-col items-end">
                  <div className="text-[8px] font-black text-slate-800 uppercase tracking-[0.5em] mb-4 font-mono">Coordinate_System</div>
                  <div className="relative w-32 h-20 border border-white/5 rounded-lg overflow-hidden opacity-30">
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                    <motion.div animate={{ x: [0, 120, 0], y: [0, 80, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-1 h-1 bg-[#39FF14] rounded-full shadow-[0_0_5px_#39FF14]" />
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }} className="flex flex-col items-center pointer-events-none mb-4">
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#39FF14] mb-2 drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">Sigue el pulso</span>
              <div className="relative h-12 w-[1px] bg-white/10 overflow-hidden">
                <motion.div animate={{ y: [-48, 48], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-[#39FF14] to-transparent shadow-[0_0_8px_#39FF14]" />
              </div>
              <ChevronDown className="w-4 h-4 text-[#39FF14] mt-1 drop-shadow-[0_0_5px_rgba(57,255,20,0.8)]" />
            </motion.div>
          </section>

          <SoundScienceSection onOpenArchive={() => handleSetView('audioarchive')} />

          <section id="herramientas" className="py-24 relative px-8 bg-black z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16 flex flex-col items-center">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 text-white uppercase tracking-[0.1em]">Más herramientas</h2>
                <div className="max-w-2xl">
                  <p className="text-slate-400 text-xl font-medium leading-relaxed italic font-bold">"El afinador es solo el comienzo"</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 mt-6 font-bold">— Vostok Lab</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                {[
                  { t: "Tuner", s: "ACTIVO", c: "#39FF14", i: Activity, action: () => handleSetView('tuner') },
                  { t: "Scale Sensor", s: "NUEVO", c: "#39FF14", i: Activity, action: () => handleSetView('scales') },
                  { t: "Harmonic Radar", s: "NUEVO", c: "#39FF14", i: Waves, action: () => handleSetView('radar') },
                  { t: "Tempo", s: "NUEVO", c: "#06b6d4", i: Zap, action: () => handleSetView('tempo') },
                  { t: "Spectrum", s: "ALFA", c: "#A855F7", i: Waves, action: () => handleSetView('spectrum') },
                  { t: "SPL Meter", s: "NUEVO", c: "#fbbf24", i: Volume2, action: () => handleSetView('spl') },
                  { t: "IR Measurer", s: "ALFA", c: "#39FF14", i: Activity, action: () => handleSetView('ir') },
                  { t: "Blog", s: "NUEVO", c: "#39FF14", i: Terminal, action: () => handleSetView('blog') }
                ].map((app, i) => {
                  const Icon = app.i;
                  return (
                    <button 
                      key={i} onClick={app.action} aria-label={`Explorar Vostok ${app.t}`}
                      className="text-left p-6 rounded-[2rem] bg-[#080808] border border-white/5 hover:border-[#39FF14]/20 transition-all flex flex-col group active:scale-[0.95] relative overflow-hidden"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border transition-transform group-hover:scale-110" style={{ backgroundColor: `${app.c}10`, borderColor: `${app.c}20` }}>
                        <Icon className="w-5 h-5" style={{ color: app.c }} />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-xs tracking-[0.2em] uppercase font-black text-white group-hover:text-[#39FF14] transition-colors">{app.t}</h3>
                        <div className="mt-2 inline-flex self-start px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border transition-colors font-bold" style={{ backgroundColor: `${app.c}10`, color: app.c, borderColor: `${app.c}20` }}>{app.s}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <Footer onInfoClick={handleInfoClick} />
        </>
      )}

      <AnimatePresence>
        {showDiagnosticConsole && <DiagnosticConsole onClose={() => setShowDiagnosticConsole(false)} currentView={view} />}
      </AnimatePresence>
    </div>
  );
}
