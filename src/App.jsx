import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, Check, Settings, Upload, Waves, X, ChevronRight, 
  Smartphone, LayoutGrid, Plus, Minus, ArrowLeft, 
  Music, Zap, Send, ChevronDown, Volume2
} from 'lucide-react';
import TempoSense from './TempoSense';
import SpectrumAnalyzer from './SpectrumAnalyzer';
import SPLMeter from './SPLMeter';
import AudioArchive from './components/AudioArchive';
import Footer from './components/Footer';
import InfoModal from './components/InfoModal';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, initAnalytics, trackEvent } from './lib/analytics';
import posthog from 'posthog-js';

// --- VOSTOK DSP: ADVANCED PITCH DETECTION (YIN-OPTIMIZED) ---
const autoCorrelate = (buf, sampleRate, isBass = false) => {
  const SIZE = buf.length;

  // 1. Decimation for Bass (E1 Stability)
  // At 48kHz, E1 (41.2Hz) is ~1165 samples. Hard to track with high noise.
  // Downsampling by 4 (to 12kHz) makes E1 ~291 samples, much more stable.
  let activeBuf = buf;
  let activeSampleRate = sampleRate;

  if (isBass) {
    const downsampled = new Float32Array(Math.floor(SIZE / 4));
    for (let i = 0; i < downsampled.length; i++) {
      downsampled[i] = (buf[i*4] + buf[i*4+1] + buf[i*4+2] + buf[i*4+3]) / 4;
    }
    activeBuf = downsampled;
    activeSampleRate = sampleRate / 4;
  }

  const N = activeBuf.length;
  const yinBuffer = new Float32Array(Math.floor(N / 2));

  // STEP 1: Difference Function
  for (let tau = 0; tau < yinBuffer.length; tau++) {
    for (let j = 0; j < yinBuffer.length; j++) {
      const delta = activeBuf[j] - activeBuf[j + tau];
      yinBuffer[tau] += delta * delta;
    }
  }

  // STEP 2: Cumulative Mean Normalized Difference Function (CMNDF)
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < yinBuffer.length; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / runningSum;
  }

  // STEP 3: Absolute Thresholding
  let period = -1;
  const threshold = 0.15;
  for (let tau = 1; tau < yinBuffer.length; tau++) {
    if (yinBuffer[tau] < threshold) {
      // Find local minimum
      while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      period = tau;
      break;
    }
  }

  if (period === -1) return -1;

  // STEP 4: Parabolic Interpolation for sub-sample precision
  let betterPeriod = period;
  if (period > 0 && period < yinBuffer.length - 1) {
    const s0 = yinBuffer[period - 1];
    const s1 = yinBuffer[period];
    const s2 = yinBuffer[period + 1];
    betterPeriod = period + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }

  return activeSampleRate / betterPeriod;
};
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const INSTRUMENTS = [
  { id: 'chromatic', name: 'Cromático', icon: Activity },
  { id: 'guitar', name: 'Guitarra', icon: Music },
  { id: 'bass', name: 'Bajo', icon: Waves },
  { id: 'ukulele', name: 'Ukelele', icon: Smartphone }
];

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
    id: 'deforest',
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

const TUNING_PRESETS = {
  STANDARD: [
    { label: '6E', midi: 40 },
    { label: '5A', midi: 45 },
    { label: '4D', midi: 50 },
    { label: '3G', midi: 55 },
    { label: '2B', midi: 59 },
    { label: '1E', midi: 64 },
  ],
  DROP_D: [
    { label: '6D', midi: 38 },
    { label: '5A', midi: 45 },
    { label: '4D', midi: 50 },
    { label: '3G', midi: 55 },
    { label: '2B', midi: 59 },
    { label: '1E', midi: 64 },
  ],
  OPEN_G: [
    { label: '6D', midi: 38 },
    { label: '5G', midi: 43 },
    { label: '4D', midi: 50 },
    { label: '3G', midi: 55 },
    { label: '2B', midi: 59 },
    { label: '1D', midi: 62 },
  ],
  DADGAD: [
    { label: '6D', midi: 38 },
    { label: '5A', midi: 45 },
    { label: '4D', midi: 50 },
    { label: '3G', midi: 55 },
    { label: '2A', midi: 57 },
    { label: '1D', midi: 62 },
  ],
  HALF_STEP_DOWN: [
    { label: '6Eb', midi: 39 },
    { label: '5Ab', midi: 44 },
    { label: '4Db', midi: 49 },
    { label: '3Gb', midi: 54 },
    { label: '2Bb', midi: 58 },
    { label: '1Eb', midi: 63 },
  ]
};

// --- HOOKS PERSONALIZADOS ---
const useWakeLock = () => {
  const wakeLock = useRef(null);
  
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
      try {
        wakeLock.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLock.current) {
      wakeLock.current.release();
      wakeLock.current = null;
    }
  }, []);

  return { requestWakeLock, releaseWakeLock };
};

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

  // Forzamos visibilidad en móvil si no está instalada, para que siempre haya un camino a la descarga
  const isMobileBrowser = typeof window !== 'undefined' && /iphone|ipad|ipod|android/.test(window.navigator.userAgent.toLowerCase());
  const canShowMobile = !isInstalled && isMobileBrowser;
  
  return { canInstall: !!installPrompt, canShowMobile, installApp, isInstalled };
};

// --- COMPONENTES DE IDENTIDAD ---
const TuningForkIcon = ({ className, strokeColor = "currentColor" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22v-8" />
    <path d="M8 14V4" />
    <path d="M16 14V4" />
    <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4" />
  </svg>
);

const GraphicIcon = ({ type, color }) => {
  const floatVariants = {
    animate: {
      y: [0, -12, 0],
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
    }
  };
  const baseClass = "w-full h-full flex items-center justify-center opacity-30 pointer-events-none";
  
  return (
    <motion.div variants={floatVariants} animate="animate" className={baseClass}>
      {type === 'triangle' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><path d="M50 10 L90 90 L10 90 Z" /><circle cx="50" cy="10" r="2" fill={color} /><line x1="10" y1="90" x2="90" y2="90" strokeDasharray="4 4" /></svg>}
      {type === 'nodes' && <svg viewBox="0 0 100 40" className="w-56 h-32" fill="none" stroke={color} strokeWidth="1.5"><path d="M0 20 Q 25 0, 50 20 T 100 20" /><path d="M0 20 Q 25 40, 50 20 T 100 20" strokeDasharray="2 2" /><circle cx="25" cy="10" r="3" fill={color} /><circle cx="75" cy="10" r="3" fill={color} /></svg>}
      {type === 'symmetry' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1"><circle cx="50" cy="50" r="40" /><path d="M50 10 L50 90 M10 50 L90 50" /><path d="M21 21 L79 79 M21 79 L79 21" strokeDasharray="3 3" /></svg>}
      {type === 'resonator' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><circle cx="50" cy="55" r="35" /><rect x="42" y="5" width="16" height="15" rx="2" /><path d="M42 20 L42 25 M58 20 L58 25" /></svg>}
      {type === 'cylinder' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><ellipse cx="50" cy="30" rx="30" ry="10" /><path d="M20 30 L20 70 A30 10 0 0 0 80 70 L80 30" /><path d="M50 45 L50 85" strokeDasharray="2 2" /></svg>}
      {type === 'triode' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><rect x="35" y="10" width="30" height="70" rx="15" /><line x1="50" y1="25" x2="50" y2="35" /><path d="M40 45 H60 M40 50 H60 M40 55 H60" strokeDasharray="2 1" /><line x1="45" y1="70" x2="55" y2="70" /></svg>}
      {type === 'strobe' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1"><circle cx="50" cy="50" r="45" /><circle cx="50" cy="50" r="35" strokeDasharray="10 5" /><circle cx="50" cy="50" r="25" strokeDasharray="5 10" /><circle cx="50" cy="50" r="5" fill={color} /></svg>}
      {type === 'spectrum' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><line x1="10" y1="90" x2="90" y2="90" /><path d="M10 90 L25 40 L40 80 L55 10 L70 85 L90 90" strokeWidth="2" /><path d="M10 90 L90 90" /></svg>}
      {type === 'correlation' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><path d="M10 50 C 20 20, 30 80, 40 50 C 50 20, 60 80, 70 50 C 80 20, 90 80, 100 50" /><line x1="10" y1="10" x2="10" y2="90" opacity="0.3" /></svg>}
      {type === 'ai' && <svg viewBox="0 0 100 100" className="w-48 h-48" fill="none" stroke={color} strokeWidth="1.5"><circle cx="50" cy="50" r="10" fill={color} fillOpacity="0.2" /><circle cx="20" cy="30" r="4" fill={color} /><circle cx="20" cy="70" r="4" fill={color} /><circle cx="80" cy="30" r="4" fill={color} /><circle cx="80" cy="70" r="4" fill={color} /><line x1="24" y1="33" x2="42" y2="45" /><line x1="24" y1="67" x2="42" y2="55" /><line x1="76" y1="33" x2="58" y2="45" /><line x1="76" y1="67" x2="58" y2="55" /></svg>}
    </motion.div>
  );
};

const VostokLogo = ({ className = "w-10 h-10" }) => (
  <div className={`${className} relative rounded-xl bg-[#050A05] flex items-center justify-center shadow-lg shadow-green-500/10 overflow-hidden border border-green-500/20 group`}>
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
    <TuningForkIcon className="w-6 h-6 text-[#39FF14] relative z-10 transition-transform group-hover:scale-110" />
  </div>
);

// --- COMPONENTES DE AFINADOR ---
function VostokTuner({ onBack }) {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [targetMidi, setTargetMidi] = useState(null);
  const [cents, setCents] = useState(0);
  const [visualCents, setVisualCents] = useState(0);
  const [activePanel, setActivePanel] = useState('center');
  const [refPitch, setRefPitch] = useState(440);
  const [smoothValue, setSmoothValue] = useState(70); 
  const [selectedInstrument, setSelectedInstrument] = useState('guitar');
  const [tuningPreset, setTuningPreset] = useState('STANDARD');
  const [signalStatus, setSignalStatus] = useState('SYS_IDLE');
  const [detectedString, setDetectedString] = useState(null);
  const [isTuned, setIsTuned] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const highpassRef = useRef(null);
  const lowpassRef = useRef(null);
  const compensationRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const rafIdRef = useRef(null);
  const audioBufferRef = useRef(null);
  const fileInputRef = useRef(null);
  const refPitchRef = useRef(refPitch);
  const selectedInstrumentRef = useRef(selectedInstrument);
  const tuningPresetRef = useRef(tuningPreset);
  const freqHistoryRef = useRef([]);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  // Configuración dinámica de filtros según el instrumento
  useEffect(() => {
    if (!highpassRef.current || !lowpassRef.current) return;

    let hpFreq = 70;
    let lpFreq = 1500;

    switch (selectedInstrument) {
      case 'bass':
        hpFreq = 30; // Necesario para el Mi grave (41.2Hz)
        lpFreq = 800; // El bajo no necesita armónicos de alta frecuencia
        break;
      case 'ukulele':
        hpFreq = 150; // El ukelele empieza en Sol (196Hz)
        lpFreq = 3000;
        break;
      case 'chromatic':
        hpFreq = 20;
        lpFreq = 4000;
        break;
      default: // guitar
        hpFreq = 70; // Mi grave es 82.4Hz
        lpFreq = 1500;
        break;
    }

    // Transición suave para evitar clicks de audio
    const now = audioContextRef.current?.currentTime || 0;
    highpassRef.current.frequency.setTargetAtTime(hpFreq, now, 0.1);
    lowpassRef.current.frequency.setTargetAtTime(lpFreq, now, 0.1);
    
    console.log(`[Vostok DSP] Filtros adaptados: ${selectedInstrument} (${hpFreq}Hz - ${lpFreq}Hz)`);
  }, [selectedInstrument]);

  // Histéresis para estabilización visual y háptica
  useEffect(() => {
    if (signalStatus !== 'ACTIVE') {
      if (isTuned) setIsTuned(false);
      return;
    }

    const absCents = Math.abs(cents);
    if (!isTuned && absCents <= 2) {
      setIsTuned(true);
    } else if (isTuned && absCents > 6) {
      setIsTuned(false);
    }
  }, [cents, isTuned, signalStatus]);

  useEffect(() => { refPitchRef.current = refPitch; }, [refPitch]);
  useEffect(() => { selectedInstrumentRef.current = selectedInstrument; }, [selectedInstrument]);
  useEffect(() => { tuningPresetRef.current = tuningPreset; }, [tuningPreset]);

  const updateLoop = useCallback(() => {
    let lastUpdate = 0;

    function loop(now) {
      if (!analyserRef.current || !audioContextRef.current) return;
      
      // Target: 20 FPS estables (1000ms / 20 = 50ms per frame)
      // Esto permite que el motor analice buffers enormes (8k) sin saturar la UI
      const shouldUpdateState = now - lastUpdate >= 50;
      
      if (!audioBufferRef.current) {
          audioBufferRef.current = new Float32Array(analyserRef.current.fftSize);
      }
      
      analyserRef.current.getFloatTimeDomainData(audioBufferRef.current);
      
      if (shouldUpdateState) {
        let rms = 0;
        for (let i = 0; i < audioBufferRef.current.length; i++) {
          rms += audioBufferRef.current[i] * audioBufferRef.current[i];
        }
        rms = Math.sqrt(rms / audioBufferRef.current.length);
        const rmsDb = 20 * Math.log10(Math.max(rms, 0.00001));
        
        const freq = autoCorrelate(audioBufferRef.current, audioContextRef.current.sampleRate, selectedInstrumentRef.current === 'bass');

        if (rmsDb < -45 || freq === -1) {
          setSignalStatus(prev => prev === 'SYS_IDLE' ? prev : 'SYS_IDLE');
          setCents(prev => Math.abs(prev) < 0.1 ? 0 : prev * 0.8);
          setPitch(prev => prev === null ? null : null);
          setDetectedString(prev => prev === null ? null : null);
          freqHistoryRef.current = [];
        } else {
          // Filtro Media Móvil 5 pasos
          freqHistoryRef.current.push(freq);
          if (freqHistoryRef.current.length > 5) freqHistoryRef.current.shift();
          
          const avgFreq = freqHistoryRef.current.reduce((a, b) => a + b, 0) / freqHistoryRef.current.length;
          setSignalStatus(prev => prev === 'ACTIVE' ? prev : 'ACTIVE');
          
          const midiFloat = 12 * (Math.log(avgFreq / refPitchRef.current) / Math.log(2)) + 69;
          let target = Math.round(midiFloat);
          let newDetectedString = null;

          if (selectedInstrumentRef.current === 'guitar') {
            const currentPreset = tuningPresetRef.current;
            const matrix = TUNING_PRESETS[currentPreset] || TUNING_PRESETS.STANDARD;
            
            let minDiff = Infinity;
            let closestString = null;
            for (const s of matrix) {
              const diff = Math.abs(midiFloat - s.midi);
              if (diff < minDiff) { minDiff = diff; closestString = s; }
            }

            if (minDiff < 1) { 
              target = closestString.midi;
              newDetectedString = closestString.label;
            }
          }

          const newCents = (midiFloat - target) * 100;
          
          // Actualización selectiva por umbral de cambio
          setPitch(prev => Math.abs(prev - avgFreq) > 0.1 ? avgFreq : prev);
          setCents(prev => Math.abs(prev - newCents) > 0.1 ? newCents : prev);
          setTargetMidi(prev => prev === target ? prev : target);
          setDetectedString(prev => prev === newDetectedString ? prev : newDetectedString);
        }
        lastUpdate = now;
      }
      
      rafIdRef.current = requestAnimationFrame(loop);
    }
    rafIdRef.current = requestAnimationFrame(loop);
  }, []);

  const startListening = async () => {
    try {
      // 1. Captura RAW: Desactivamos el procesamiento nativo para evitar latencia adicional
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 22050 // Sugerencia de hardware (puede no ser respetada por todos los browsers)
        } 
      });
      
      // Forzamos el AudioContext a 22050Hz para optimización de procesamiento y resolución en bajos
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 22050
      });
      
      // Browser Safety: Forzamos el resume() ya que muchos navegadores inician el contexto en 'suspended'
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096;
      
      // 2. Capa de Compensación de Micrófono (Hardware EQ Inverse)
      const compensationFilter = audioContextRef.current.createBiquadFilter();
      compensationFilter.type = 'peaking';
      
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isIOS) {
        // iPhone suele tener realce en medios-altos (claridad de voz) y corte en graves.
        // Compensamos reforzando fundamentales y suavizando el brillo.
        compensationFilter.frequency.value = 6000;
        compensationFilter.gain.value = -3;
        compensationFilter.Q.value = 1.0;
        console.log("[Vostok DSP] Compensación activa: Perfil iOS (De-Esser/Low-Boost)");
      } else {
        // Android genérico/Flagships suelen tener respuesta más plana pero con ruido DSP.
        // Reforzamos la zona de fundamentales (80Hz-200Hz).
        compensationFilter.frequency.value = 150;
        compensationFilter.gain.value = 3;
        compensationFilter.Q.value = 0.7;
        console.log("[Vostok DSP] Compensación activa: Perfil Android/Generic (Bass Reinforcement)");
      }
      compensationRef.current = compensationFilter;

      // 3. Capa de Pre-procesamiento Dinámica (Filtros Desacoplados)
      const highpassFilter = audioContextRef.current.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.Q.value = 0.7;
      highpassRef.current = highpassFilter;

      const lowpassFilter = audioContextRef.current.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.Q.value = 0.7;
      lowpassRef.current = lowpassFilter;

      // Aplicar valores iniciales según instrumento
      let hpFreq = 70, lpFreq = 1500;
      if (selectedInstrument === 'bass') { hpFreq = 30; lpFreq = 800; }
      else if (selectedInstrument === 'ukulele') { hpFreq = 150; lpFreq = 3000; }
      else if (selectedInstrument === 'chromatic') { hpFreq = 20; lpFreq = 4000; }
      
      highpassFilter.frequency.value = hpFreq;
      lowpassFilter.frequency.value = lpFreq;

      // 4. Cadena de conexión estricta: Source -> Compensation -> Highpass -> Lowpass -> Analyser
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      mediaStreamSourceRef.current.connect(compensationFilter);
      compensationFilter.connect(highpassFilter);
      highpassFilter.connect(lowpassFilter);
      lowpassFilter.connect(analyserRef.current);
      
      setIsListening(true);
      requestWakeLock();
      updateLoop();

      posthog.capture('tuner_engine_active', {
        $groups: { HARDWARE_SPEC: 'vostok_core_v1' },
        sample_rate: audioContextRef.current.sampleRate,
        base_latency_ms: audioContextRef.current.baseLatency ? audioContextRef.current.baseLatency * 1000 : 0,
        is_mobile: /iPhone|Android/i.test(navigator.userAgent),
        engine_status: 'STABLE_DSP'
      });
    } catch (e) { 
      console.error("[Vostok DSP Error]", e);
      if (e.name === 'NotAllowedError') {
        alert("Acceso denegado: Por favor, permite el uso del micrófono en la barra de direcciones del navegador.");
      } else if (e.name === 'NotFoundError') {
        alert("No se encontró ningún micrófono conectado.");
      } else {
        alert(`Error de inicialización: ${e.message}`);
      }
      setIsListening(false);
    }
  };

  const stopListening = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (mediaStreamSourceRef.current) {
        const stream = mediaStreamSourceRef.current.mediaStream;
        if (stream) stream.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    setIsListening(false);
    setPitch(null);
    setIsTuned(false);
    releaseWakeLock();
  }, [releaseWakeLock]);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  // Haptic feedback cuando está afinado
  useEffect(() => {
    if (isListening && isTuned) {
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  }, [isTuned, isListening]);

  useEffect(() => {
    let animId;
    const animate = () => {
      setVisualCents(prev => {
        const sensitivity = 0.35 - (smoothValue / 100) * 0.33;
        const diff = cents - prev;
        if (Math.abs(diff) < 0.001) return cents;
        return prev + diff * sensitivity;
      });
      animId = requestAnimationFrame(animate);
    };
    if (isListening) animate();
    return () => cancelAnimationFrame(animId);
  }, [cents, smoothValue, isListening]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
      const floatData = audioBuffer.getChannelData(0);
      
      // Analizar una ventana de 2048 muestras del medio del archivo
      const start = Math.floor(floatData.length / 2);
      const windowData = floatData.slice(start, start + 2048);
      const freq = autoCorrelate(windowData, 44100);

      if (freq !== -1 && freq > 20 && freq < 2000) {
        setRefPitch(Math.round(freq));
        trackEvent('calibration_file_success', { freq });
        alert(`Calibración Optimizada: Referencia ajustada a ${Math.round(freq)}Hz`);
      } else {
        alert("No se detectó un tono claro de calibración. Use un archivo con una nota constante.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al procesar el archivo de audio.");
    }
  };

  const note = targetMidi ? { n: noteStrings[targetMidi % 12], o: Math.floor(targetMidi / 12) - 1 } : { n: "-", o: "" };

  return (
    <div className={`fixed inset-0 bg-[#010101] z-[100] flex flex-col items-center overflow-hidden font-sans text-white transition-all duration-500 ${isTuned ? 'shadow-[inset_0_0_100px_rgba(57,255,20,0.15)] border-4 border-[#39FF14]/20 rounded-[2.5rem]' : ''}`}>
      {/* Dynamic Background Glow - Noir-Tech */}
      <div className={`absolute inset-0 opacity-40 blur-[120px] transition-colors duration-1000 pointer-events-none will-change-[background-color] ${Math.abs(cents) < 5 && pitch ? 'bg-[#39FF14]' : 'bg-cyan-900/30'}`} />
      
      <div className="absolute inset-0 pointer-events-none crt-scanlines z-[120]" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {!isListening && (
        <div className="absolute inset-0 z-[150] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center" onClick={startListening}>
          <VostokLogo className="w-20 h-20 mb-10 animate-pulse" />
          <h2 className="text-4xl font-black mb-4 tracking-tighter text-white uppercase">Vostok Tuner</h2>
          <p className="text-slate-500 text-[10px] tracking-[0.2em] mb-12 uppercase">Toque para iniciar la afinación de alta fidelidad</p>
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="py-3 px-10 border border-white/10 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:bg-white/10 transition-colors">Regresar</button>
        </div>
      )}

      <header className="w-full pt-[max(3.5rem,env(safe-area-inset-top))] px-8 flex justify-between items-start z-[130]">
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setActivePanel('left')} 
            aria-label="Seleccionar Instrumento"
            className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all backdrop-blur-md hover:bg-white/10" 
            style={{ WebkitBackdropFilter: 'blur(12px)' }}
          >
            <LayoutGrid className="w-5 h-5 text-slate-400" />
          </button>
          <button 
            onClick={onBack} 
            aria-label="Regresar"
            className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all backdrop-blur-md hover:bg-white/10" 
            style={{ WebkitBackdropFilter: 'blur(12px)' }}
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="text-center mt-2 flex flex-col items-center">
          <div className="text-[9px] font-black text-[#39FF14] uppercase tracking-[0.4em] mb-2 opacity-60 font-mono">Analog/Digital Master</div>
          <div className="text-5xl font-mono font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
            {pitch ? pitch.toFixed(1) : "000.0"}<span className="text-[12px] ml-2 text-[#39FF14]">Hz</span>
          </div>
          <div className="text-[8px] font-black text-slate-600 mt-2 tracking-[0.3em] uppercase font-mono">Ref: {refPitch}Hz</div>
        </div>
        <button 
          onClick={() => setActivePanel('right')} 
          aria-label="Configuración"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all backdrop-blur-md hover:bg-white/10" 
          style={{ WebkitBackdropFilter: 'blur(12px)' }}
        >
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </header>

      {/* METER DE AGUJA */}
      <div className="relative w-full max-w-[320px] h-36 mt-12 z-[130] shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className="stroke-white/5" strokeWidth="12" strokeLinecap="round" />
          <path d="M 92 20 A 80 80 0 0 1 108 20" fill="none" className={`transition-all duration-500 ${isTuned ? 'stroke-[#39FF14] shadow-[0_0_15px_#39FF14]' : 'stroke-white/5'}`} strokeWidth="14" strokeLinecap="round" />
          <g style={{ transform: `rotate(${Math.max(-85, Math.min(85, visualCents * 1.6))}deg)`, transformOrigin: '100px 100px' }} className="will-change-transform">
            <line x1="100" y1="100" x2="100" y2="20" stroke={pitch ? (isTuned ? '#39FF14' : Math.abs(cents) < 15 ? '#fbbf24' : '#06b6d4') : '#333'} strokeWidth="5" strokeLinecap="round" className="transition-all duration-300" />
            <circle cx="100" cy="100" r="5" fill={pitch ? "#39FF14" : "#333"} />
          </g>
        </svg>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center z-[130] w-full px-6 -mt-8 relative">
        <div className={`flex flex-col items-center justify-center h-[250px] w-full transition-opacity duration-500 ${signalStatus === 'SYS_IDLE' ? 'opacity-20' : 'opacity-100'}`}>
          {/* Note Display & Tension Guide Chevrons */}
            <div className="flex items-center justify-center gap-6 md:gap-12 relative w-full h-[180px] md:h-[220px]">
              <div className={`transition-all duration-300 flex items-center justify-center h-full ${pitch && !isTuned && cents < -2 ? 'text-[#06b6d4] opacity-100 drop-shadow-[0_0_15px_#06b6d4]' : 'text-white/10 opacity-20'}`}>
                <div className="text-5xl md:text-6xl font-black">▲</div>
              </div>
              
              <div className={`text-[9rem] md:text-[11rem] font-mono font-black leading-none tracking-tighter flex items-start transition-all select-none will-change-transform ${isTuned ? 'text-[#39FF14] drop-shadow-[0_0_20px_#39FF14]' : 'text-white'}`}>
                {note.n}<span className="text-3xl md:text-4xl font-black opacity-50 mt-8 md:mt-10 ml-2">{note.o}</span>
              </div>
              
              <div className={`transition-all duration-300 flex items-center justify-center h-full ${pitch && !isTuned && cents > 2 ? 'text-[#06b6d4] opacity-100 drop-shadow-[0_0_15px_#06b6d4]' : 'text-white/10 opacity-20'}`}>
                <div className="text-5xl md:text-6xl font-black">▼</div>
              </div>
            </div>
            
            {/* String Detection Label */}
            <div className="h-8 mt-2 flex items-center justify-center">
              {detectedString && (
                <div className="text-[#39FF14] font-mono text-xl font-black tracking-widest">
                  [ {detectedString} ]
                </div>
              )}
            </div>
            
            {/* Cents Display */}
            <div className={`mt-4 px-12 py-3 rounded-full border border-white/10 text-xl md:text-2xl font-mono font-black transition-colors ${Math.abs(cents) < 5 && pitch ? 'text-[#39FF14] border-[#39FF14]/30 bg-[#39FF14]/5' : 'text-slate-500 bg-white/5'}`}>
              {pitch ? `${cents > 0 ? '+' : ''}${Math.round(cents)} Cents` : "-- Cents"}
            </div>
          </div>
      </main>

      <div className="h-[env(safe-area-inset-bottom)] w-full" />

      <AnimatePresence>
        {activePanel === 'left' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[180]" onClick={() => setActivePanel('center')} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-4 left-4 w-full max-w-[280px] bg-[#0A0A0A]/95 backdrop-blur-3xl z-[200] p-8 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col text-white" style={{ WebkitBackdropFilter: 'blur(30px)' }}>
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">Módulo</span>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight font-mono">Instrumentos</h3>
                </div>
                <button onClick={() => setActivePanel('center')} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <div className="grid gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {INSTRUMENTS.map(inst => {
                  const Icon = inst.icon;
                  return (
                    <div key={inst.id} className="flex flex-col gap-2">
                      <button 
                        onClick={() => { 
                          trackEvent('instrument_select', { instrument: inst.id });
                          setSelectedInstrument(inst.id); 
                          if (inst.id !== 'guitar') setActivePanel('center'); 
                        }} 
                        className={`flex items-center gap-4 p-5 rounded-3xl border transition-all relative overflow-hidden group ${selectedInstrument === inst.id ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-white' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'}`}
                      >
                        <Icon className={`w-5 h-5 relative z-10 ${selectedInstrument === inst.id ? 'text-[#39FF14]' : ''}`} />
                        <span className="font-bold font-mono text-sm uppercase tracking-widest relative z-10">{inst.name}</span>
                        {selectedInstrument === inst.id && <Check className="w-4 h-4 ml-auto text-[#39FF14] relative z-10" />}
                      </button>
                      
                      {selectedInstrument === 'guitar' && inst.id === 'guitar' && (
                        <div className="pl-4 border-l-2 border-[#39FF14]/30 ml-6 my-2 flex flex-col gap-2">
                          {Object.keys(TUNING_PRESETS).map(preset => (
                            <button 
                              key={preset}
                              onClick={() => {
                                setTuningPreset(preset);
                                trackEvent('preset_change', { preset });
                                setActivePanel('center');
                              }}
                              className={`p-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest text-left font-mono ${tuningPreset === preset ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'}`}
                            >
                              {preset.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.aside>
          </>
        )}

        {activePanel === 'right' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[180]" onClick={() => setActivePanel('center')} />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-4 right-4 w-full max-w-[280px] bg-[#0A0A0A]/95 backdrop-blur-3xl z-[200] p-8 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col text-white" style={{ WebkitBackdropFilter: 'blur(30px)' }}>
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">Calibración</span>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight font-mono">Ajustes</h3>
                </div>
                <button onClick={() => setActivePanel('center')} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <div className="space-y-10 overflow-y-auto pr-2 custom-scrollbar">
                <section>
                  <label className="text-[10px] font-black text-slate-600 mb-6 block uppercase tracking-[0.2em] border-l-2 border-[#39FF14] pl-3 font-mono">Referencia A4</label>
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-full border border-white/10">
                    <button onClick={() => setRefPitch(p => p - 1)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center active:scale-90 transition-transform"><Minus className="w-4 h-4" /></button>
                    <span className="text-2xl font-black font-mono text-white tabular-nums tracking-tighter">{refPitch}<span className="text-xs text-slate-500 ml-1 font-normal">Hz</span></span>
                    <button onClick={() => setRefPitch(p => p + 1)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center active:scale-90 transition-transform"><Plus className="w-4 h-4" /></button>
                  </div>
                </section>
                <section>
                  <div className="flex justify-between mb-6">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-l-2 border-[#39FF14] pl-3 font-mono">Smoothing</label>
                    <span className="text-[10px] font-black font-mono text-[#39FF14] tracking-widest">{smoothValue}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={smoothValue} onChange={(e) => setSmoothValue(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-[#39FF14] cursor-pointer" />
                </section>
                <section className="pt-8 border-t border-white/5">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 bg-white/5 border border-white/10 rounded-3xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                    <Upload className="w-4 h-4" />
                    Cargar Calibración
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                </section>
              </div>
              <button onClick={() => setActivePanel('center')} className="mt-auto w-full py-5 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-3xl text-[10px] font-black text-[#39FF14] uppercase tracking-widest active:scale-95 transition-transform font-mono">Listo</button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- LANDING COMPONENTS ---
function SoundScienceSection({ onOpenArchive }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [history, setHistory] = useState([0]);
  const current = PROTAGONISTAS[index];

  const nextCard = () => {
    let nextIdx;
    // Como tenemos 9 tarjetas en total, mantenemos un historial de las últimas 7
    // para asegurar que no se repitan recientemente y siempre haya opciones nuevas.
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
      {/* Elementos decorativos de fondo */}
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
            {/* Tarjetas de fondo integradas en la animación para que se muevan con la tarjeta activa */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#080808] border border-white/5 rounded-[2.5rem] transform translate-y-4 scale-[0.95] -z-10 transition-transform duration-500 group-hover:translate-y-5 group-hover:scale-[0.94]" />
            <div className="absolute top-0 left-0 w-full h-full bg-[#050505] border border-white/5 rounded-[2.5rem] transform translate-y-8 scale-[0.90] -z-20 transition-transform duration-500 group-hover:translate-y-10 group-hover:scale-[0.88]" />

            <div className="relative z-20 bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden transition-all duration-500 group-hover:border-cyan-500/30">
              
              {/* Icono gráfico en el fondo */}
              <div className="absolute right-[-40px] top-[-40px] w-64 h-64 pointer-events-none opacity-20 md:opacity-30 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
                <GraphicIcon type={current.grafico} color={current.color} />
              </div>

              {/* Contenido de la tarjeta */}
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

                {/* Footer técnico de la tarjeta */}
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

              {/* Brillo interno al pasar el mouse */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ 
                  background: `radial-gradient(circle at center, ${current.color}05 0%, transparent 70%)` 
                }} 
              />
            </div>
            
            {/* Indicador de acción */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[9px] font-mono tracking-widest text-cyan-500 uppercase font-black">
              Click para explorar otro hito
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicador de progreso inferior */}
      <div className="mt-20 flex gap-3 z-10">
        {PROTAGONISTAS.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-10 bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'w-2 bg-white/10'}`} 
          />
        ))}
      </div>

      {/* Botón Acceso Databank */}
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

function ContactModal({ isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;
    
    // Si supabase no está configurado, simulamos el envío o mostramos error de conexión.
    if (!supabase) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('sending');
    const { error } = await supabase
      .from('messages')
      .insert([{ 
        user_mail: email.trim(),
        content: message.trim(), 
        created_at: new Date() 
      }]);

    if (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      trackEvent('message_sent', { length: message.length });
      setStatus('success');
      setMessage('');
      setEmail('');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-[#080808] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-[#39FF14]" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Buzón de Contacto</h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Transmisión Directa</p>
              </div>
            </div>

            {status === 'success' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-48 flex flex-col items-center justify-center text-center">
                <Check className="w-12 h-12 text-[#39FF14] mb-4" />
                <p className="text-sm font-bold text-slate-300">Mensaje transmitido con éxito al equipo de Vostok Labs.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-[#39FF14] uppercase tracking-widest pl-2 border-l-2 border-[#39FF14]">ID Operador (Email)</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full bg-[#030303] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-[#39FF14]/40 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-[#39FF14] uppercase tracking-widest pl-2 border-l-2 border-[#39FF14]">Reporte / Mensaje</label>
                  <textarea 
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe aquí tu observación o reporte..."
                    className="w-full h-32 bg-[#030303] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-[#39FF14]/40 transition-colors resize-none"
                  />
                </div>
                
                {!supabase && status === 'error' && (
                  <p className="text-xs text-red-500 font-bold text-center">Error: VITE_SUPABASE_URL no configurado.</p>
                )}

                <button 
                  type="submit"
                  disabled={status === 'sending' || !message.trim() || !email.trim()}
                  className="mt-2 h-14 flex items-center justify-center gap-3 border border-[#39FF14]/20 rounded-full bg-[#39FF14]/10 hover:bg-[#39FF14]/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-[0.4em]">
                    {status === 'sending' ? 'Tansmitiendo...' : 'Enviar Reporte'}
                  </span>
                  <Send className="w-4 h-4 text-[#39FF14] group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const [view, setView] = useState('home');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoType, setInfoType] = useState('faq');
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { canInstall, canShowMobile, installApp, isInstalled } = usePWAInstall();
  const isIOS = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  useEffect(() => {
    initAnalytics();
  }, []);

  const handleContact = useCallback(() => {
    trackEvent('contact_click');
    setShowContactModal(true);
  }, []);

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
      {view === 'tuner' && <VostokTuner onBack={() => setView('home')} />}
      {view === 'tempo' && <TempoSense onBack={() => setView('home')} />}
      {view === 'spectrum' && <SpectrumAnalyzer onBack={() => setView('home')} />}
      {view === 'spl' && <SPLMeter onBack={() => setView('home')} />}
      {view === 'audioarchive' && <AudioArchive onClose={() => setView('home')} />}

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} type={infoType} />

      {/* Guía de Instalación iOS Estilizada */}
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

      {/* Optimized Background Glows - Boosted for depth and visibility */}
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

      <nav className="fixed top-0 w-full z-40 px-8 py-6 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-white/5 pt-[max(1.5rem,env(safe-area-inset-top))]" style={{ WebkitBackdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <VostokLogo className="w-10 h-10" />
          <span className="text-xl tracking-tight uppercase tracking-widest flex items-center">
            <span className="font-black">Vostok</span>
            <span className="font-light opacity-60">Labs</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!isInstalled && (canInstall || canShowMobile) && (
            <button 
              onClick={handleInstall} 
              aria-label="Descargar aplicación"
              className="hidden sm:flex px-6 py-2.5 bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#39FF14]/20 active:scale-95 transition-all"
            >
              Descargar App
            </button>
          )}
          <button 
            onClick={handleContact} 
            aria-label={'Contactar con Vostok Labs'}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
          >
            Contacto
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-start px-8 text-center relative pt-24 pb-8 z-10">
        <div className="max-w-4xl flex flex-col items-center flex-grow justify-center">
          {canShowMobile && (
            <button 
              onClick={handleInstall} 
              className="sm:hidden mb-6 px-6 py-3 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] rounded-full text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all"
            >
              Instalar App
            </button>
          )}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mb-6"
          >
            Analog Audio Laboratory
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 uppercase"
          >
            Redefiniendo el <br/> Audio Digital
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed tracking-tight"
          >
            Herramientas de grado de estudio con interfaces táctiles diseñadas para la creación musical precisa.
          </motion.p>
          
          <div className="flex flex-row flex-wrap gap-4 justify-center w-full sm:w-auto mb-16">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSetView('tuner')} 
              aria-label="Abrir Afinador Vostok"
              className="flex-1 sm:flex-none px-8 sm:px-10 py-3 bg-white/5 border border-purple-500/30 text-white rounded-full backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.1)] hover:border-purple-500/60 transition-all flex items-center justify-center gap-3 group will-change-transform"
              style={{ WebkitBackdropFilter: 'blur(20px)' }}
            >
              <TuningForkIcon className="w-6 h-6 text-[#39FF14] group-hover:scale-110 transition-transform" />
              <div className="text-xl leading-none uppercase tracking-tighter flex items-center">
                <span className="font-black">Vostok</span>
                <span className="font-light opacity-70 ml-1">Tuner</span>
              </div>
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('herramientas')?.scrollIntoView({behavior: 'smooth'})} 
              aria-label="Ver más herramientas"
              className="flex-1 sm:flex-none px-8 sm:px-10 py-3 bg-white/5 border border-white/10 text-white rounded-full font-black text-sm hover:bg-white/10 transition-all uppercase tracking-widest backdrop-blur-md flex items-center justify-center shadow-lg"
              style={{ WebkitBackdropFilter: 'blur(20px)' }}
            >
              Más herramientas
            </motion.button>
          </div>
        </div>

        {/* Indicador de Scroll optimizado para visibilidad Above-the-fold */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex flex-col items-center pointer-events-none mb-4"
        >
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#39FF14] mb-2 drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">Sigue el pulso</span>
          <div className="relative h-12 w-[1px] bg-white/10 overflow-hidden">
            <motion.div
              animate={{ y: [-48, 48], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-[#39FF14] to-transparent shadow-[0_0_8px_#39FF14]"
            />
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
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: "Tuner", d: "AFINACIÓN DE ALTA FIDELIDAD CON DETECCIÓN DE TONO AVANZADA.", s: "ACTIVO", c: "#39FF14", i: Activity, action: () => handleSetView('tuner') },
              { t: "TempoSense", d: "ANALIZADOR DE RITMO Y METRÓNOMO PROFESIONAL.", s: "NUEVO", c: "#06b6d4", i: Zap, action: () => handleSetView('tempo') },
              { t: "Spectrum", d: "VISUALIZADOR DE ESPECTRO EN TIEMPO REAL. ANALIZA TUS FRECUENCIAS.", s: "ALFA", c: "#A855F7", i: Waves, action: () => handleSetView('spectrum') },
              { t: "SPL Meter", d: "SONÓMETRO DE PRECISIÓN PARA MEDICIÓN DE PRESIÓN SONORA.", s: "NUEVO", c: "#fbbf24", i: Volume2, action: () => handleSetView('spl') }
            ].map((app, i) => {
              const Icon = app.i;
              return (
                <button 
                  key={i} 
                  onClick={app.action}
                  aria-label={`Explorar Vostok ${app.t}`}
                  className="text-left p-10 rounded-[3rem] bg-[#080808] border border-white/5 hover:border-[#39FF14]/20 transition-all flex flex-col group active:scale-[0.98]"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border transition-transform group-hover:scale-110" style={{ backgroundColor: `${app.c}10`, borderColor: `${app.c}20` }}>
                    <Icon className="w-6 h-6" style={{ color: app.c }} />
                  </div>
                  <h3 className="text-xl tracking-widest uppercase mb-4 flex items-center">
                    <span className="font-black">Vostok</span>
                    <span className="font-light opacity-60 ml-1">{app.t}</span>
                  </h3>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed font-bold uppercase">{app.d}</p>
                  <div className="mt-auto inline-flex self-start px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors font-bold" style={{ backgroundColor: `${app.c}10`, color: app.c, borderColor: `${app.c}20` }}>{app.s}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <Footer onContactClick={handleContact} onInfoClick={handleInfoClick} />
    </div>
  );
}
