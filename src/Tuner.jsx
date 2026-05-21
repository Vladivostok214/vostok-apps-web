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

const INSTRUMENTS = [
  { id: 'chromatic', name: 'Cromático', icon: Activity },
  { id: 'guitar', name: 'Guitarra', icon: Music },
  { id: 'bass', name: 'Bajo', icon: Waves },
  { id: 'ukulele', name: 'Ukelele', icon: Smartphone }
];

export default function VostokTuner({ onBack }) {
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
  const mediaStreamSourceRef = useRef(null);
  const rafIdRef = useRef(null);
  const audioBufferRef = useRef(null);
  const fileInputRef = useRef(null);
  const refPitchRef = useRef(refPitch);
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

  useEffect(() => { refPitchRef.current = refPitch; }, [refPitch]);
  useEffect(() => { selectedInstrumentRef.current = selectedInstrument; }, [selectedInstrument]);
  useEffect(() => { tuningPresetRef.current = tuningPreset; }, [tuningPreset]);

  const updateLoop = useCallback(() => {
    let lastUpdate = 0;
    function loop(now) {
      if (!analyserRef.current || !audioContextRef.current || audioContextRef.current.state === 'closed') return;
      const shouldUpdateState = now - lastUpdate >= 50;
      if (!audioBufferRef.current) audioBufferRef.current = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(audioBufferRef.current);
      
      if (shouldUpdateState) {
        let rms = 0;
        for (let i = 0; i < audioBufferRef.current.length; i++) rms += audioBufferRef.current[i] * audioBufferRef.current[i];
        rms = Math.sqrt(rms / audioBufferRef.current.length);
        const rmsDb = 20 * Math.log10(Math.max(rms, 0.00001));
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096;
      const hp = audioContextRef.current.createBiquadFilter(); hp.type = 'highpass'; highpassRef.current = hp;
      const lp = audioContextRef.current.createBiquadFilter(); lp.type = 'lowpass'; lowpassRef.current = lp;
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      mediaStreamSourceRef.current.connect(hp); hp.connect(lp); lp.connect(analyserRef.current);
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
        const sensitivity = 0.35 - (smoothValue / 100) * 0.33;
        const diff = cents - prev;
        return Math.abs(diff) < 0.001 ? cents : prev + diff * sensitivity;
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
      const offlineCtx = new (window.OfflineAudioContext || window.webkitAudioContext)(1, 44100, 44100);
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
      const floatData = audioBuffer.getChannelData(0);
      const freq = autoCorrelate(floatData.slice(0, 2048), 44100);
      if (freq !== -1) setRefPitch(Math.round(freq));
    } catch (err) { alert("Error"); }
  };

  const note = targetMidi ? { n: noteStrings[targetMidi % 12], o: Math.floor(targetMidi / 12) - 1 } : { n: "-", o: "" };
  const activeTuning = TUNINGS[selectedInstrument.toUpperCase()]?.[tuningPreset] || TUNINGS[selectedInstrument.toUpperCase()]?.STANDARD;

  return (
    <div className={`fixed inset-0 bg-[#010101] z-[100] flex flex-col items-center overflow-hidden font-sans text-white transition-all duration-500 ${isTuned ? 'shadow-[inset_0_0_100px_rgba(57,255,20,0.15)] border-4 border-[#39FF14]/20 rounded-[2.5rem]' : ''}`}>
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
          <button onClick={() => setActivePanel('left')} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all backdrop-blur-md hover:bg-white/10"><LayoutGrid className="w-5 h-5 text-slate-400" /></button>
          <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all backdrop-blur-md hover:bg-white/10"><ArrowLeft className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="text-center mt-2 flex flex-col items-center">
          <div className="text-[9px] font-black text-[#39FF14] uppercase tracking-[0.4em] mb-2 opacity-60 font-mono">Analog/Digital Master</div>
          <div className="text-5xl font-mono font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
            {pitch ? pitch.toFixed(1) : "000.0"}<span className="text-[12px] ml-2 text-[#39FF14]">Hz</span>
          </div>
          <div className="text-[8px] font-black text-slate-600 mt-2 tracking-[0.3em] uppercase font-mono">Ref: {refPitch}Hz</div>
        </div>
        <button onClick={() => setActivePanel('right')} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all backdrop-blur-md hover:bg-white/10"><Settings className="w-5 h-5 text-slate-400" /></button>
      </header>

      <div className="relative w-full max-w-[400px] h-36 mt-12 z-[130] shrink-0 flex items-center justify-center">
        {/* String Reference Column (Left Only) */}
        {activeTuning && (
          <div className="absolute left-0 top-0 h-full flex flex-col justify-center gap-2 pr-6">
            {activeTuning.labels.map((l) => (
              <div key={l} className={`text-xs font-black font-mono transition-all duration-500 text-right ${detectedString === l ? 'text-[#39FF14] scale-150 drop-shadow-[0_0_10px_#39FF14]' : 'text-white/20'}`}>
                {l}
              </div>
            ))}
          </div>
        )}

        <svg viewBox="0 0 200 120" className="w-[260px] h-full overflow-visible">
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

      <AnimatePresence>
        {activePanel === 'left' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[180]" onClick={() => setActivePanel('center')} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-4 left-4 w-full max-w-[280px] bg-[#0A0A0A]/95 backdrop-blur-3xl z-[200] p-8 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col text-white">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col"><span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">Módulo</span><h3 className="text-xl font-black text-white uppercase tracking-tight font-mono">Instrumentos</h3></div>
                <button onClick={() => setActivePanel('center')} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <div className="grid gap-3 overflow-y-auto pr-2 custom-scrollbar text-white">
                {INSTRUMENTS.map(inst => {
                  const Icon = inst.icon;
                  const isSelected = selectedInstrument === inst.id;
                  return (
                    <div key={inst.id} className="flex flex-col gap-2">
                      <button onClick={() => { setSelectedInstrument(inst.id); if (inst.id === 'chromatic') setActivePanel('center'); }} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all relative overflow-hidden group ${isSelected ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-white' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'}`}>
                        <Icon className={`w-5 h-5 relative z-10 ${isSelected ? 'text-[#39FF14]' : ''}`} />
                        <span className="font-bold font-mono text-sm uppercase tracking-widest relative z-10">{inst.name}</span>
                        <div className="ml-auto flex items-center gap-2">
                           {isSelected && <Check className="w-4 h-4 text-[#39FF14]" />}
                           {inst.id !== 'chromatic' && <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'rotate-180 text-white' : 'text-slate-700'}`} />}
                        </div>
                      </button>
                      <AnimatePresence>
                        {isSelected && inst.id !== 'chromatic' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-4 border-l-2 border-[#39FF14]/30 ml-6 my-2 flex flex-col gap-2 overflow-hidden">
                            {Object.keys(TUNINGS[inst.id.toUpperCase()] || {}).map(preset => (
                              <button key={preset} onClick={() => { setTuningPreset(preset); setActivePanel('center'); }} className={`p-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest text-left font-mono ${tuningPreset === preset ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]' : 'bg-white/5 border-transparent text-slate-700 hover:bg-white/10'}`}>{preset.replace(/_/g, ' ')}</button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
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
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-4 right-4 w-full max-w-[280px] bg-[#0A0A0A]/95 backdrop-blur-3xl z-[200] p-8 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col text-white">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col"><span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">Calibración</span><h3 className="text-xl font-black text-white uppercase tracking-tight font-mono">Ajustes</h3></div>
                <button onClick={() => setActivePanel('center')} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <div className="space-y-10 overflow-y-auto pr-2 custom-scrollbar text-white">
                <section>
                  <label className="text-[10px] font-black text-slate-600 mb-6 block uppercase tracking-[0.2em] border-l-2 border-[#39FF14] pl-3 font-mono">Referencia A4</label>
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-full border border-white/10 text-white">
                    <button onClick={() => setRefPitch(p => p - 1)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center active:scale-90 transition-transform"><Minus className="w-4 h-4" /></button>
                    <span className="text-2xl font-black font-mono text-white tabular-nums tracking-tighter">{refPitch}<span className="text-xs text-slate-500 ml-1 font-normal">Hz</span></span>
                    <button onClick={() => setRefPitch(p => p + 1)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center active:scale-90 transition-transform"><Plus className="w-4 h-4" /></button>
                  </div>
                </section>
                <section>
                  <div className="flex justify-between mb-6 text-white"><label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-l-2 border-[#39FF14] pl-3 font-mono">Smoothing</label><span className="text-[10px] font-black font-mono text-[#39FF14] tracking-widest">{smoothValue}%</span></div>
                  <input type="range" min="0" max="100" value={smoothValue} onChange={(e) => setSmoothValue(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-[#39FF14] cursor-pointer" />
                </section>
                <section className="pt-8 border-t border-white/5">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 bg-white/5 border border-white/10 rounded-3xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"><Upload className="w-4 h-4" />Cargar Calibración</button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                </section>
              </div>
              <button onClick={() => setActivePanel('center')} className="mt-auto w-full py-5 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-3xl text-[10px] font-black text-[#39FF14] uppercase tracking-widest active:scale-95 transition-transform font-mono">Listo</button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .glow-text { text-shadow: 0 0 20px rgba(57, 255, 20, 0.4); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(57, 255, 20, 0.1); border-radius: 10px; }
      `}} />
    </div>
  );
}
