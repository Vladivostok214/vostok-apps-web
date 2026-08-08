import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, Check, Settings, Upload, Plus, Minus, ArrowLeft, 
  Music, Waves, Smartphone, LayoutGrid, X, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from './lib/analytics';
import { VostokLogo } from './components/VostokIdentity';
import { useWakeLock } from './lib/vostok-hooks';
import { TUNINGS, getNoteInfo } from './lib/vostok-music-db';
import { useAudioDevice, routeAudioChannel } from './context/AudioDeviceContext';

const MAX_BUFFER_SIZE = 8192;
const sharedDownsampleBuffer = new Float32Array(MAX_BUFFER_SIZE / 4);
const sharedYinBuffer = new Float32Array(MAX_BUFFER_SIZE / 2);
const sharedDiffBuffer = new Float32Array(MAX_BUFFER_SIZE / 2);

const autoCorrelate = (buf, sampleRate, isBass = false) => {
  const SIZE = buf.length;
  let activeBuf = buf;
  let activeSampleRate = sampleRate;

  if (isBass) {
    const downsampledLen = SIZE >> 2;
    for (let i = 0; i < downsampledLen; i++) {
      sharedDownsampleBuffer[i] = (buf[i*4] + buf[i*4+1] + buf[i*4+2] + buf[i*4+3]) * 0.25;
    }
    activeBuf = sharedDownsampleBuffer.subarray(0, downsampledLen);
    activeSampleRate = sampleRate * 0.25;
  }

  const N = activeBuf.length;
  const halfN = N >> 1;
  const yinBuffer = sharedYinBuffer.subarray(0, halfN);
  const diffBuffer = sharedDiffBuffer.subarray(0, halfN);

  for (let tau = 0; tau < yinBuffer.length; tau++) {
    yinBuffer[tau] = 0;
    for (let j = 0; j < yinBuffer.length; j++) {
      const delta = activeBuf[j] - activeBuf[j + tau];
      yinBuffer[tau] += delta * delta;
    }
    diffBuffer[tau] = yinBuffer[tau];
  }

  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < yinBuffer.length; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / (runningSum || 0.0001);
  }

  let period = -1;
  const threshold = 0.15;
  for (let tau = 1; tau < yinBuffer.length; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) tau++;
      period = tau;
      break;
    }
  }

  if (period === -1) return -1;
  let betterPeriod = period;
  if (period > 0 && period < diffBuffer.length - 1) {
    const s0 = diffBuffer[period - 1];
    const s1 = diffBuffer[period];
    const s2 = diffBuffer[period + 1];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (Math.abs(denom) > 0.00001) betterPeriod = period + (s2 - s0) / denom;
  }
  return activeSampleRate / betterPeriod;
};

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const GuitarIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 2h4v2h-4z" />
    <path d="M11 4v6h2V4z" />
    <path d="M13 10c2 0 4 1 4 3 0 1.5-1 2-1 3s1 1.5 1 3c0 2-2 4-5 4s-5-2-5-4c0-1.5 1-1.5 1-3s-1-1.5-1-3c0-2 2-3 4-3z" />
    <circle cx="12" cy="15" r="1.5" />
  </svg>
);

const BassIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 2h3l1 3h-4z" />
    <path d="M11 5v7h2V5z" />
    <path d="M13 12l3-3c1-1 2-1 2 1v3c0 2-1 3-2 3h-1c0 2 1 3 1 4 0 2-2 2-4 2s-4 0-4-2c0-1 1-2 1-4h-1c-1 0-2-1-2-3v-3c0-2 1-2 2-1l3 3z" />
    <line x1="10.5" y1="16" x2="13.5" y2="16" />
    <line x1="10.5" y1="18" x2="13.5" y2="18" />
  </svg>
);

const UkuleleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.5 4h3v2h-3z" />
    <path d="M11.5 6v5h1V6z" />
    <path d="M12.5 11c1.5 0 2.5.5 2.5 2 0 1-.5 1.5-.5 2.5s.5 1.5.5 2.5c0 1.5-1.5 3-3 3s-3-1.5-3-3c0-1 .5-1.5.5-2.5s-.5-1.5-.5-2.5c0-1.5 1-2 2.5-2z" />
    <circle cx="12" cy="15.5" r="1" />
  </svg>
);

const INSTRUMENTS = [
  { id: 'chromatic', name: 'Cromático', icon: Activity,
    color: { text: 'text-[#39FF14]', border: 'border-[#39FF14]/40', bg: 'bg-[#39FF14]/10', shadow: 'shadow-[0_0_20px_rgba(57,255,20,0.2)]', glow: '#39FF14' } },
  { id: 'guitar',   name: 'Guitarra',  icon: GuitarIcon,
    color: { text: 'text-cyan-400',   border: 'border-cyan-400/40',   bg: 'bg-cyan-400/10',   shadow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',  glow: '#22d3ee' } },
  { id: 'bass',     name: 'Bajo',      icon: BassIcon,
    color: { text: 'text-violet-400', border: 'border-violet-400/40', bg: 'bg-violet-400/10', shadow: 'shadow-[0_0_20px_rgba(167,139,250,0.2)]', glow: '#a78bfa' } },
  { id: 'ukulele',  name: 'Ukelele',   icon: UkuleleIcon,
    color: { text: 'text-amber-400',  border: 'border-amber-400/40',  bg: 'bg-amber-400/10',  shadow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]',  glow: '#fbbf24' } },
];

const REF_PITCHES = [
  { hz: 432, label: '432 Hz', desc: 'Natural' },
  { hz: 440, label: '440 Hz', desc: 'Estándar' },
  { hz: 441, label: '441 Hz', desc: 'Orquesta EU' },
  { hz: 442, label: '442 Hz', desc: 'Orquesta IT' },
  { hz: 444, label: '444 Hz', desc: 'Cristal' },
];

export default function VostokTuner({ onBack }) {
  const { selectedDeviceId, selectedChannel } = useAudioDevice();
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [targetMidi, setTargetMidi] = useState(null);
  const [cents, setCents] = useState(0);
  const [visualCents, setVisualCents] = useState(0);
  const [selectedInstrument, setSelectedInstrument] = useState('guitar');
  const [expandedInstrument, setExpandedInstrument] = useState('guitar');
  const [tuningPreset, setTuningPreset] = useState('STANDARD');
  const [refPitch, setRefPitch] = useState(440);
  const [signalStatus, setSignalStatus] = useState('SYS_IDLE');
  const [detectedString, setDetectedString] = useState(null);
  const [isTuned, setIsTuned] = useState(false);
  const [isClipping, setIsClipping] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const highpassRef = useRef(null);
  const lowpassRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const rafIdRef = useRef(null);
  const audioBufferRef = useRef(null);
  const fileInputRef = useRef(null);
  const refPitchRef = useRef(440);
  const selectedInstrumentRef = useRef(selectedInstrument);
  const tuningPresetRef = useRef(tuningPreset);
  const freqHistoryRef = useRef([]);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  useEffect(() => {
    if (!highpassRef.current || !lowpassRef.current) return;
    let hpFreq = selectedInstrument === 'bass' ? 30 : 70;
    let lpFreq = selectedInstrument === 'bass' ? 800 : 1500;
    if (selectedInstrument === 'ukulele') hpFreq = 150;
    const now = audioContextRef.current?.currentTime || 0;
    highpassRef.current.frequency.setTargetAtTime(hpFreq, now, 0.1);
    lowpassRef.current.frequency.setTargetAtTime(lpFreq, now, 0.1);
  }, [selectedInstrument]);

  useEffect(() => {
    if (signalStatus !== 'ACTIVE') { setIsTuned(false); return; }
    const absCents = Math.abs(cents);
    if (!isTuned && absCents <= 2) setIsTuned(true);
    else if (isTuned && absCents > 6) setIsTuned(false);
  }, [cents, isTuned, signalStatus]);

  useEffect(() => { selectedInstrumentRef.current = selectedInstrument; }, [selectedInstrument]);
  useEffect(() => { tuningPresetRef.current = tuningPreset; }, [tuningPreset]);
  useEffect(() => { refPitchRef.current = refPitch; }, [refPitch]);

  const updateLoop = useCallback(() => {
    let lastUpdate = 0;
    function loop(now) {
      if (!analyserRef.current || !audioContextRef.current || audioContextRef.current.state === 'closed') return;
      const shouldUpdateState = now - lastUpdate >= 50;
      if (!audioBufferRef.current) audioBufferRef.current = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(audioBufferRef.current);
      
      if (shouldUpdateState) {
        let rms = 0;
        let peak = 0;
        for (let i = 0; i < audioBufferRef.current.length; i++) {
          const val = audioBufferRef.current[i];
          rms += val * val;
          const absVal = Math.abs(val);
          if (absVal > peak) peak = absVal;
        }
        rms = Math.sqrt(rms / audioBufferRef.current.length);
        const rmsDb = 20 * Math.log10(Math.max(rms, 0.00001));
        
        const clippingActive = peak > 0.95;
        setIsClipping(clippingActive);

        const freq = autoCorrelate(audioBufferRef.current, audioContextRef.current.sampleRate, selectedInstrumentRef.current === 'bass');
        
        if (rmsDb < -45 || freq === -1) {
          setSignalStatus('SYS_IDLE');
          setCents(prev => Math.abs(prev) < 0.1 ? 0 : prev * 0.8);
          setPitch(null);
          setDetectedString(null);
          freqHistoryRef.current = [];
        } else {
          freqHistoryRef.current.push(freq);
          if (freqHistoryRef.current.length > 5) freqHistoryRef.current.shift();
          const avgFreq = freqHistoryRef.current.reduce((a, b) => a + b, 0) / freqHistoryRef.current.length;
          setSignalStatus('ACTIVE');
          const midiFloat = 12 * (Math.log(avgFreq / refPitchRef.current) / Math.log(2)) + 69;
          let target = Math.round(midiFloat);
          let newDetectedString = null;

          if (selectedInstrumentRef.current !== 'chromatic') {
            const instrumentKey = selectedInstrumentRef.current.toUpperCase();
            const currentTuning = TUNINGS[instrumentKey]?.[tuningPresetRef.current] || TUNINGS[instrumentKey]?.STANDARD;
            
            if (currentTuning) {
              let minDiff = Infinity;
              let closestStringIdx = -1;
              currentTuning.strings.forEach((midi, idx) => {
                const diff = Math.abs(midiFloat - midi);
                if (diff < minDiff) { minDiff = diff; closestStringIdx = idx; }
              });
              if (minDiff < 1.5) { 
                target = currentTuning.strings[closestStringIdx];
                newDetectedString = currentTuning.labels[closestStringIdx];
              }
            }
          }
          
          const newCents = (midiFloat - target) * 100;
          setPitch(avgFreq);
          setCents(newCents);
          setTargetMidi(target);
          setDetectedString(newDetectedString);
        }
        lastUpdate = now;
      }
      rafIdRef.current = requestAnimationFrame(loop);
    }
    rafIdRef.current = requestAnimationFrame(loop);
  }, []);

  const startListening = async () => {
    try {
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          ...(selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {})
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096;
      const hp = audioContextRef.current.createBiquadFilter(); hp.type = 'highpass'; highpassRef.current = hp;
      const lp = audioContextRef.current.createBiquadFilter(); lp.type = 'lowpass'; lowpassRef.current = lp;
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      const routedSource = routeAudioChannel(audioContextRef.current, mediaStreamSourceRef.current, selectedChannel);
      routedSource.connect(hp); hp.connect(lp); lp.connect(analyserRef.current);
      setIsListening(true); requestWakeLock(); updateLoop();
    } catch (e) { alert("Error de micrófono"); setIsListening(false); }
  };

  const stopListening = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
        mediaStreamSourceRef.current.disconnect();
    }
    if (audioContextRef.current) audioContextRef.current.close();
    setIsListening(false); releaseWakeLock();
  }, [releaseWakeLock]);

  useEffect(() => { return () => stopListening(); }, [stopListening]);

  useEffect(() => {
    let animId;
    const animate = () => {
      setVisualCents(prev => {
        const sensitivity = 0.02; // Hardcoded to 100% smoothing
        const diff = cents - prev;
        return Math.abs(diff) < 0.001 ? cents : prev + diff * sensitivity;
      });
      animId = requestAnimationFrame(animate);
    };
    if (isListening) animate();
    return () => cancelAnimationFrame(animId);
  }, [cents, isListening]);

  const note = targetMidi ? { n: noteStrings[targetMidi % 12], o: Math.floor(targetMidi / 12) - 1 } : { n: "-", o: "" };
  const activeTuning = TUNINGS[selectedInstrument.toUpperCase()]?.[tuningPreset] || TUNINGS[selectedInstrument.toUpperCase()]?.STANDARD;

  return (
    <div className={`fixed inset-0 bg-[#010101] z-[100] flex flex-col items-center overflow-hidden font-sans text-white transition-all duration-500 ${isTuned ? 'shadow-[inset_0_0_100px_rgba(57,255,20,0.15)] border-4 border-[#39FF14]/20 rounded-[2.5rem]' : ''}`}>
      <div className={`absolute inset-0 opacity-40 blur-[120px] transition-colors duration-1000 pointer-events-none will-change-[background-color] ${Math.abs(cents) < 5 && pitch ? 'bg-[#39FF14]' : 'bg-cyan-900/30'}`} />
      <div className="absolute inset-0 pointer-events-none crt-scanlines z-[120]" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {!isListening && (
        <div className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center" onClick={startListening}>
          <div className="max-w-md bg-[#050505] border border-white/10 p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/10 to-[#39FF14]/10 rounded-[2.5rem] blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative flex flex-col items-center">
              <VostokLogo className="w-16 h-16 mb-8 animate-pulse text-[#39FF14]" />
              <h2 className="text-3xl font-black mb-1.5 tracking-tighter text-white uppercase font-sans">Vostok Tuner</h2>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#39FF14] mb-8 drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">Activación de Sensor</span>
              
              <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8 max-w-sm">
                Vostok requiere acceso a tu micrófono o entrada física para analizar el espectro de audio en tiempo real. La señal se procesa estrictamente en local y de forma 100% privada.
              </p>

              <div className="flex flex-col gap-3.5 w-full mb-10 text-left border-l-2 border-[#39FF14]/30 pl-4">
                <div className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] shadow-[0_0_6px_#39FF14]" /> Paso 1: Pulsa en "Iniciar Captura"
                </div>
                <div className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] shadow-[0_0_6px_#39FF14]" /> Paso 2: Concede permisos de micrófono
                </div>
                <div className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] shadow-[0_0_6px_#39FF14]" /> Paso 3: Toca una nota para afinar
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button 
                  onClick={(e) => { e.stopPropagation(); startListening(); }} 
                  className="flex-1 py-4 bg-[#39FF14] text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)] font-bold cursor-pointer"
                >
                  Iniciar Captura
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onBack(); }} 
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  Regresar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="absolute top-0 left-0 w-full pt-[max(2rem,env(safe-area-inset-top))] px-4 md:px-8 z-[150] pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all backdrop-blur-md hover:bg-white/10">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
      </header>

      <div className="flex-1 w-full flex flex-col md:flex-row overflow-hidden z-[130] mt-16 md:mt-0 pb-6 md:pb-0">
        
        {/* SIDEBAR INSTRUMENTS */}
        <aside className="w-full md:w-[280px] shrink-0 px-2 md:px-8 py-4 md:pt-16 md:pb-4 flex flex-col gap-4 items-center md:items-stretch md:justify-center order-last border-t border-white/5 md:border-t-0 md:border-l bg-[#010101]/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none z-[140]">
          
          {/* INSTRUMENT BUTTONS */}
          <div className="flex flex-row md:flex-col justify-center gap-2 md:gap-4 w-full">
            {INSTRUMENTS.map(inst => {
              const Icon = inst.icon;
              const isSelected = selectedInstrument === inst.id;
              const isExpanded = expandedInstrument === inst.id;
              return (
                <div key={inst.id} className="flex flex-col gap-2 flex-1 md:flex-none">
                  <button 
                    onClick={() => {
                      if (selectedInstrument !== inst.id) {
                        setSelectedInstrument(inst.id);
                        setExpandedInstrument(inst.id);
                      } else {
                        setExpandedInstrument(prev => prev === inst.id ? null : inst.id);
                      }
                    }} 
                    className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-3 md:p-5 rounded-2xl md:rounded-[2rem] border transition-all relative overflow-hidden group w-full ${
                      isSelected
                        ? `${inst.color.bg} ${inst.color.border} ${inst.color.text} ${inst.color.shadow}`
                        : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 relative z-10 ${isSelected ? inst.color.text : ''}`} />
                    <span className="font-bold font-mono text-[8px] md:text-xs uppercase tracking-tighter md:tracking-[0.2em] relative z-10 text-center">{inst.name}</span>
                  </button>
                  <AnimatePresence>
                    {isExpanded && inst.id !== 'chromatic' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="hidden md:flex pl-4 border-l-2 border-[#39FF14]/30 ml-6 my-2 flex-col gap-2 overflow-hidden">
                        {Object.keys(TUNINGS[inst.id.toUpperCase()] || {}).map(preset => (
                          <button key={preset} onClick={() => setTuningPreset(preset)} className={`p-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest text-left font-mono ${tuningPreset === preset ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]' : 'bg-white/5 border-transparent text-slate-700 hover:bg-white/10'}`}>
                            {preset.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* MOBILE TUNING OPTIONS (Centered below) */}
          <AnimatePresence>
            {expandedInstrument && expandedInstrument !== 'chromatic' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex md:hidden flex-wrap justify-center gap-2 w-full overflow-hidden mt-2">
                {Object.keys(TUNINGS[expandedInstrument.toUpperCase()] || {}).map(preset => (
                  <button key={preset} onClick={() => setTuningPreset(preset)} className={`px-4 py-2 rounded-2xl border transition-all text-[9px] font-black uppercase tracking-widest text-center font-mono ${tuningPreset === preset ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]' : 'bg-white/5 border-transparent text-slate-700 hover:bg-white/10'}`}>
                    {preset.replace(/_/g, ' ')}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* REFERENCE PITCH FADER — shared desktop & mobile */}
          <div className="mt-auto md:mt-auto pt-5 border-t border-white/5 w-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] font-mono">Ref. Afinación</span>
              <span className="text-[11px] font-black font-mono text-[#39FF14]">
                {refPitch} Hz
                <span className="text-slate-600 font-normal text-[9px] ml-1.5">
                  {REF_PITCHES.find(r => r.hz === refPitch)?.desc}
                </span>
              </span>
            </div>

            {/* Track + thumb */}
            <div className="relative px-1">
              {/* Tick marks */}
              <div className="flex justify-between mb-1.5 px-0.5">
                {REF_PITCHES.map(({ hz }) => (
                  <button
                    key={hz}
                    onClick={() => setRefPitch(hz)}
                    className="flex flex-col items-center gap-0.5 group"
                  >
                    <div className={`w-0.5 h-2 rounded-full transition-all ${refPitch === hz ? 'bg-[#39FF14]' : 'bg-white/20 group-hover:bg-white/40'}`} />
                    <span className={`text-[7px] font-mono font-black transition-colors ${refPitch === hz ? 'text-[#39FF14]' : 'text-white/25 group-hover:text-white/50'}`}>
                      {hz}
                    </span>
                  </button>
                ))}
              </div>

              {/* Native range input styled as fader */}
              <input
                type="range"
                min={0}
                max={REF_PITCHES.length - 1}
                step={1}
                value={REF_PITCHES.findIndex(r => r.hz === refPitch)}
                onChange={(e) => setRefPitch(REF_PITCHES[parseInt(e.target.value)].hz)}
                className="ref-fader w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #39FF14 0%, #39FF14 ${(REF_PITCHES.findIndex(r => r.hz === refPitch) / (REF_PITCHES.length - 1)) * 100}%, rgba(255,255,255,0.1) ${(REF_PITCHES.findIndex(r => r.hz === refPitch) / (REF_PITCHES.length - 1)) * 100}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
            </div>
          </div>
        </aside>

        {/* MAIN TUNER AREA */}
        <div className="flex-1 flex flex-col items-center justify-center relative w-full mt-8 md:mt-0 pt-8 md:pt-16 pb-4">
          
          {/* FREQUENCY DISPLAY */}
          <div className="text-center mb-6 md:mb-12 flex flex-col items-center">
            {/* DIGITAL CLIP / OVERLOAD BADGE */}
            <div className="h-6 mb-2">
              <AnimatePresence>
                {isClipping && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="px-3 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-[8px] font-black uppercase tracking-[0.3em] font-mono shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-pulse flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                    AOP_CLIP_WARN / Atenuar Entrada
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-[9px] font-black text-[#39FF14] uppercase tracking-[0.4em] mb-2 opacity-60 font-mono">Frecuencia</div>
            <div className="text-5xl font-mono font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
              {pitch ? pitch.toFixed(1) : "000.0"}<span className="text-[12px] ml-2 text-[#39FF14]">Hz</span>
            </div>
            <div className="text-[8px] font-black text-slate-600 mt-2 tracking-[0.3em] uppercase font-mono">Ref: {refPitch} Hz</div>
          </div>

          <div className="relative w-full max-w-[400px] h-32 md:h-36 shrink-0 flex items-center justify-center">
          {/* String Reference — larger, stacked, glow on detection */}
          {activeTuning && (() => {
            const activeInst = INSTRUMENTS.find(i => i.id === selectedInstrument);
            const glowColor = activeInst?.color?.glow || '#39FF14';
            return (
              <div className="absolute top-0 h-full flex flex-col justify-center gap-1 pr-2" style={{ left: 'calc(50% - 155px)' }}>
                {activeTuning.labels.map((l) => {
                  const isActive = detectedString === l;
                  return (
                    <div
                      key={l}
                      className={`font-black font-mono transition-all duration-300 text-right leading-none ${
                        isActive
                          ? 'text-lg md:text-xl scale-125 md:scale-150'
                          : 'text-sm md:text-base text-white/20'
                      }`}
                      style={isActive ? { color: glowColor, filter: `drop-shadow(0 0 8px ${glowColor})` } : {}}
                    >
                      {l}
                    </div>
                  );
                })}
              </div>
            );
          })()}

        <svg viewBox="0 0 200 120" className="w-[260px] h-full overflow-visible">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className="stroke-white/5" strokeWidth="12" strokeLinecap="round" />
          <path d="M 92 20 A 80 80 0 0 1 108 20" fill="none" className={`transition-all duration-500 ${isTuned ? 'stroke-[#39FF14] shadow-[0_0_15px_#39FF14]' : 'stroke-white/5'}`} strokeWidth="14" strokeLinecap="round" />
          <g style={{ transform: `rotate(${Math.max(-85, Math.min(85, visualCents * 1.6))}deg)`, transformOrigin: '100px 100px' }} className="will-change-transform">
            <line x1="100" y1="100" x2="100" y2="20" stroke={pitch ? (isTuned ? '#39FF14' : Math.abs(cents) < 15 ? '#fbbf24' : '#06b6d4') : '#333'} strokeWidth="5" strokeLinecap="round" className="transition-all duration-300" />
            <circle cx="100" cy="100" r="5" fill={pitch ? "#39FF14" : "#333"} />
          </g>
        </svg>
      </div>

      <main className="flex flex-col items-center justify-center z-[130] w-full px-6 -mt-4 md:-mt-8 relative">
        <div className={`flex flex-col items-center justify-center h-[250px] w-full transition-opacity duration-500 ${signalStatus === 'SYS_IDLE' ? 'opacity-20' : 'opacity-100'}`}>
            <div className="flex items-center justify-center gap-6 md:gap-12 relative w-full h-[180px] md:h-[220px]">
              <div className={`transition-all duration-300 flex items-center justify-center h-full ${pitch && !isTuned && cents < -2 ? 'text-[#06b6d4] opacity-100 drop-shadow-[0_0_15px_#06b6d4]' : 'text-white/10 opacity-20'}`}><div className="text-5xl md:text-6xl font-black">▲</div></div>
              <div className={`text-[9rem] md:text-[11rem] font-mono font-black leading-none tracking-tighter flex items-start transition-all select-none will-change-transform ${isTuned ? 'text-[#39FF14] drop-shadow-[0_0_20px_#39FF14]' : 'text-white'}`}>{note.n}<span className="text-3xl md:text-4xl font-black opacity-50 mt-8 md:mt-10 ml-2">{note.o}</span></div>
              <div className={`transition-all duration-300 flex items-center justify-center h-full ${pitch && !isTuned && cents > 2 ? 'text-[#06b6d4] opacity-100 drop-shadow-[0_0_15px_#06b6d4]' : 'text-white/10 opacity-20'}`}><div className="text-5xl md:text-6xl font-black">▼</div></div>
            </div>
            <div className="h-8 mt-2 flex items-center justify-center">
               {detectedString && <div className="text-[#39FF14] font-mono text-xl font-black tracking-widest animate-in fade-in zoom-in duration-300">[ {detectedString} ]</div>}
            </div>
            <div className={`mt-4 px-12 py-3 rounded-full border border-white/10 text-xl md:text-2xl font-mono font-black transition-colors ${Math.abs(cents) < 5 && pitch ? 'text-[#39FF14] border-[#39FF14]/30 bg-[#39FF14]/5' : 'text-slate-500 bg-white/5'}`}>{pitch ? `${cents > 0 ? '+' : ''}${Math.round(cents)} Cents` : "-- Cents"}</div>
          </div>
        </main>
      </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .glow-text { text-shadow: 0 0 20px rgba(57, 255, 20, 0.4); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(57, 255, 20, 0.1); border-radius: 10px; }
        input[type=range].ref-fader { -webkit-appearance: none; appearance: none; outline: none; }
        input[type=range].ref-fader::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #010101;
          border: 2px solid #39FF14;
          box-shadow: 0 0 10px rgba(57,255,20,0.5), 0 0 3px rgba(57,255,20,0.3);
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        input[type=range].ref-fader::-webkit-slider-thumb:hover {
          box-shadow: 0 0 18px rgba(57,255,20,0.8), 0 0 6px rgba(57,255,20,0.5);
        }
        input[type=range].ref-fader::-moz-range-thumb {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #010101;
          border: 2px solid #39FF14;
          box-shadow: 0 0 10px rgba(57,255,20,0.5);
          cursor: pointer;
        }
      `}} />
    </div>
  );
}
