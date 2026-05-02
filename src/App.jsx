import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, Check, Settings, Upload, Waves, X, ChevronRight, 
  Smartphone, LayoutGrid, Plus, Minus, Disc, Radio, Target, 
  Brain, ArrowRight, BellRing, MousePointer2, ArrowLeft, Music, Headphones, Zap, Info, Cpu
} from 'lucide-react';

// --- COMPONENTE: ICONO DIAPASÓN ---
const TuningForkIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22v-8" />
    <path d="M8 14V4" />
    <path d="M16 14V4" />
    <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4" />
  </svg>
);

// --- LOGO PRINCIPAL ---
const VostokLogo = ({ className = "w-10 h-10" }) => (
  <div className={`${className} relative rounded-xl bg-[#050A05] flex items-center justify-center shadow-lg shadow-green-500/10 overflow-hidden border border-green-500/20 group`}>
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
    <TuningForkIcon className="w-6 h-6 text-[#39FF14] relative z-10 transition-transform group-hover:scale-110" />
  </div>
);

// --- DATOS HISTÓRICOS (GENEALOGÍA) ---
const PROTAGONISTAS = [
  { id: 'pitagoras', nombre: 'PITÁGORAS', titulo: 'El Monocordio', descripcion: 'Descubrió que la armonía es matemática pura. Dividiendo una cuerda en radios exactos (2:1, 3:2), estableció las bases de la escala musical que hoy rige el mundo occidental.', grafico: 'triangle', color: '#00f5ff' },
  { id: 'sauveur', nombre: 'JOSEPH SAUVEUR', titulo: 'Padre de la Acústica', descripcion: 'A pesar de ser sordo, acuñó el término "Acústica". Fue el primero en calcular la frecuencia absoluta de un sonido y en identificar los nodos y vientres en cuerdas vibrantes.', grafico: 'nodes', color: '#00d1ff' },
  { id: 'chladni', nombre: 'ERNST CHLADNI', titulo: 'El Visualizador', descripcion: 'Reveló la geometría del sonido. Sus figuras de arena sobre placas de metal mostraron que las ondas tienen patrones visuales simétricos llamados líneas nodales.', grafico: 'symmetry', color: '#00b8ff' },
  { id: 'helmholtz', nombre: 'VON HELMHOLTZ', titulo: 'Analista del Timbre', descripcion: 'Inventó los resonadores para descomponer sonidos complejos. Su trabajo permitió entender cómo el cerebro distingue el color tonal entre una nota de piano y una de violín.', grafico: 'resonator', color: '#0099ff' }
];

// --- GRÁFICOS CIENTÍFICOS ---
const GraphicIcon = ({ type, color }) => {
  const baseClass = "w-full h-full flex items-center justify-center opacity-40";
  switch (type) {
    case 'triangle':
      return <div className={baseClass}><svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" stroke={color} strokeWidth="1.5"><path d="M50 10 L90 90 L10 90 Z" /><circle cx="50" cy="10" r="2" fill={color} /><line x1="10" y1="90" x2="90" y2="90" strokeDasharray="4 4" /></svg></div>;
    case 'nodes':
      return <div className={baseClass}><svg viewBox="0 0 100 40" className="w-32 h-16" fill="none" stroke={color} strokeWidth="1.5"><path d="M0 20 Q 25 0, 50 20 T 100 20" /><path d="M0 20 Q 25 40, 50 20 T 100 20" strokeDasharray="2 2" /><circle cx="25" cy="10" r="3" fill={color} /><circle cx="75" cy="10" r="3" fill={color} /></svg></div>;
    case 'symmetry':
      return <div className={baseClass}><svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" stroke={color} strokeWidth="1"><circle cx="50" cy="50" r="40" /><path d="M50 10 L50 90 M10 50 L90 50" /><path d="M21 21 L79 79 M21 79 L79 21" strokeDasharray="3 3" /></svg></div>;
    case 'resonator':
      return <div className={baseClass}><svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" stroke={color} strokeWidth="1.5"><circle cx="50" cy="55" r="35" /><rect x="42" y="5" width="16" height="15" rx="2" /><path d="M42 20 L42 25 M58 20 L58 25" /></svg></div>;
    default: return <Activity className="w-16 h-16 opacity-30" style={{ color }} />;
  }
};

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const autoCorrelate = (buf, sampleRate) => {
  let SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;
  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buf[i]) < thres) { r1 = i; break; } }
  for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; } }
  buf = buf.slice(r1, r2);
  SIZE = buf.length;
  const c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i];
  }
  let d = 0; while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) { if (c[i] > maxval) { maxval = c[i]; maxpos = i; } }
  let T0 = maxpos;
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
};

// --- COMPONENTE AFINADOR ---
function VostokTuner({ onBack }) {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [targetMidi, setTargetMidi] = useState(null);
  const [cents, setCents] = useState(0);
  const [visualCents, setVisualCents] = useState(0);
  const [selectedInstrument, setSelectedInstrument] = useState('chromatic');
  const [activePanel, setActivePanel] = useState('center');
  const [refPitch, setRefPitch] = useState(440);
  const [smoothValue, setSmoothValue] = useState(70); 
  
  const sensitivity = 0.35 - (smoothValue / 100) * 0.33;

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const audioSourceRef = useRef(null);
  const rafIdRef = useRef(null);
  const tapeRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isLocked, setIsLocked] = useState(false);
  const lockTimerRef = useRef(null);
  const hasPlayedFeedbackRef = useRef(false);

  // RESET ESTRICTO AL MONTAR
  useEffect(() => {
    setActivePanel('center');
    return () => stopListening();
  }, []);

  const currentStatus = isListening && pitch !== null 
    ? (Math.abs(cents) <= 3 ? 'tuned' : Math.abs(cents) <= 12 ? 'close' : 'far') 
    : 'idle';

  const triggerSuccessFeedback = useCallback(() => {
    if (hasPlayedFeedbackRef.current) return;
    if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
    if (audioContextRef.current) {
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
      gain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, audioContextRef.current.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.7);
    }
    hasPlayedFeedbackRef.current = true;
    setIsLocked(true);
    setTimeout(() => setIsLocked(false), 2000);
  }, []);

  useEffect(() => {
    if (currentStatus === 'tuned') {
      if (!lockTimerRef.current) {
        lockTimerRef.current = setTimeout(() => triggerSuccessFeedback(), 1000);
      }
    } else {
      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
      }
      hasPlayedFeedbackRef.current = false;
    }
  }, [currentStatus, triggerSuccessFeedback]);

  useEffect(() => {
    let animId;
    const animate = () => {
      setVisualCents(prev => {
        const diff = cents - prev;
        if (Math.abs(diff) < 0.001) return cents;
        return prev + diff * sensitivity;
      });
      animId = requestAnimationFrame(animate);
    };
    if (isListening) animate();
    return () => cancelAnimationFrame(animId);
  }, [cents, sensitivity, isListening]);

  const startListening = async () => {
    try {
      if (isListening) stopListening();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.connect(analyserRef.current);
      }
      setIsListening(true);
      setActivePanel('center');
      updateLoop();
    } catch (e) { console.error(e); }
  };

  const stopListening = () => {
    cancelAnimationFrame(rafIdRef.current);
    if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
    if (audioSourceRef.current) try { audioSourceRef.current.stop(); } catch(e) {}
    if (audioContextRef.current) audioContextRef.current.close();
    setIsListening(false);
    setPitch(null);
  };

  const updateLoop = () => {
    if (!analyserRef.current) return;
    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, audioContextRef.current.sampleRate);
    if (freq !== -1) {
      const midi = 12 * (Math.log(freq / refPitch) / Math.log(2)) + 69;
      let target = Math.round(midi);
      setCents((midi - target) * 100);
      setPitch(freq);
      setTargetMidi(target);
      if (tapeRef.current) tapeRef.current.style.transform = `translateX(-${(midi - 20) * 80 + 40}px)`;
    }
    rafIdRef.current = requestAnimationFrame(updateLoop);
  };

  const note = targetMidi ? { n: noteStrings[targetMidi % 12], o: Math.floor(targetMidi / 12) - 1 } : { n: "-", o: "" };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center overflow-hidden touch-none select-none font-sans">
      <div className={`absolute inset-0 opacity-20 blur-[120px] transition-colors duration-1000 ${currentStatus === 'tuned' ? 'bg-[#39FF14]' : 'bg-purple-600'}`} />
      
      {!isListening && (
        <div className="absolute inset-0 z-[150] bg-black flex flex-col items-center justify-center p-8 text-center" onClick={(e) => { e.stopPropagation(); startListening(); }}>
          <VostokLogo className="w-24 h-24 mb-10 animate-pulse" />
          <h2 className="text-5xl font-black mb-4 tracking-tighter text-white uppercase">Vostok Tuner</h2>
          <p className="text-slate-500 font-medium max-w-xs leading-relaxed mb-12 uppercase text-[10px] tracking-[0.2em]">
            Toque para iniciar calibración analógica/digital
          </p>
          <button onClick={(e) => {e.stopPropagation(); onBack();}} className="py-3 px-10 border border-white/10 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">Regresar</button>
        </div>
      )}

      <header className="w-full pt-14 px-8 flex justify-between items-start z-20 shrink-0">
        <div className="flex flex-col gap-3">
          <button onClick={(e) => { e.stopPropagation(); setActivePanel('left'); }} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
            <LayoutGrid className="w-5 h-5 text-slate-400" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="text-center mt-2 flex flex-col items-center">
          <div className="text-[9px] font-black text-[#39FF14] uppercase tracking-[0.4em] mb-2 opacity-60">Analog/Digital Master</div>
          <div className="text-6xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_25px_rgba(57,255,20,0.5)]">
            {pitch ? pitch.toFixed(1) : "000.0"}<span className="text-[12px] ml-2 text-[#39FF14] font-black tracking-widest uppercase">Hz</span>
          </div>
          <div className="text-[8px] font-black text-slate-600 mt-2 uppercase tracking-[0.3em]">Ref: {refPitch}Hz</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setActivePanel('right'); }} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center z-10 w-full px-6">
        <div className={`text-[12rem] font-black leading-none tracking-tighter flex items-start select-none transition-all duration-500 ${isLocked ? 'scale-110 text-[#39FF14] drop-shadow-[0_0_40px_rgba(57,255,20,0.4)]' : 'text-white'}`}>
          {note.n}<span className="text-4xl font-black opacity-20 mt-10 ml-2">{note.o}</span>
        </div>
        <div className={`mt-4 px-12 py-3 rounded-full border border-white/10 text-2xl font-black transition-all duration-500 ${isLocked ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]' : currentStatus === 'tuned' ? 'bg-[#39FF14]/10 border-[#39FF14]/50 text-[#39FF14]' : 'bg-white/5 border-transparent text-slate-700 uppercase tracking-widest'}`}>
          {pitch ? `${cents > 0 ? '+' : ''}${Math.round(cents)} Cents` : "-- Cents"}
        </div>
      </main>

      <footer className="w-full h-40 relative overflow-hidden flex items-end justify-center pb-14 shrink-0 border-t border-white/5">
        <div className="absolute left-1/2 bottom-12 w-1.5 h-14 -translate-x-1/2 z-20 bg-[#39FF14] rounded-full shadow-[0_0_20px_#39FF14]"></div>
        <div className="absolute left-1/2 bottom-12 flex items-end transition-transform duration-100" ref={tapeRef}>
          {Array.from({length: 81}).map((_, i) => (
            <div key={i} className="w-[80px] flex flex-col items-center flex-shrink-0 opacity-100">
              <span className="text-[10px] font-black mb-4 text-slate-500 tracking-[0.2em] uppercase">{noteStrings[(i + 20) % 12]}</span>
              <div className={`w-1 rounded-full ${(i + 20) % 12 === 0 ? 'h-10 bg-slate-500' : 'h-4 bg-slate-800'}`}></div>
            </div>
          ))}
        </div>
      </footer>

      {activePanel === 'right' && (
        <aside className="fixed inset-y-0 right-0 w-80 bg-black/95 backdrop-blur-3xl z-[200] p-10 shadow-2xl border-l border-white/10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black tracking-tighter text-white uppercase tracking-[0.1em]">Ajustes</h3>
            <X className="w-6 h-6 text-slate-500 cursor-pointer" onClick={() => setActivePanel('center')} />
          </div>
          <div className="space-y-12">
            <div>
              <label className="text-[10px] font-black text-slate-600 mb-6 block text-center tracking-[0.3em] uppercase">Pitch Referencia A4</label>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-full border border-white/10">
                <button onClick={() => setRefPitch(p => Math.max(300, p - 1))} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full"><Minus className="w-4 h-4 text-white" /></button>
                <div className="text-2xl font-black tabular-nums text-white tracking-tighter">{refPitch}Hz</div>
                <button onClick={() => setRefPitch(p => Math.min(500, p + 1))} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full"><Plus className="w-4 h-4 text-white" /></button>
              </div>
            </div>
            <button onClick={() => setActivePanel('center')} className="w-full py-5 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-full text-[10px] font-black text-[#39FF14] uppercase tracking-[0.3em]">Regresar</button>
          </div>
        </aside>
      )}
      {activePanel !== 'center' && <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[180]" onClick={() => setActivePanel('center')} />}
    </div>
  );
}

// --- SECCIÓN: GENEALOGÍA DEL SONIDO ---
function SoundScienceSection() {
  const [index, setIndex] = useState(0);
  const current = PROTAGONISTAS[index];

  return (
    <section className="py-24 px-6 md:p-12 bg-[#050505] flex flex-col items-center justify-center overflow-hidden relative border-y border-white/5">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900 rounded-full blur-[120px]" />
      </div>
      <div className="mb-12 text-center z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-500/80 font-bold">Vostok Archivo Histórico</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-light tracking-tighter text-white uppercase">
          La Genealogía del <span className="font-black text-cyan-400">Sonido</span>
        </h1>
      </div>
      <div className="relative w-full max-w-lg z-10" onClick={() => setIndex((prev) => (prev + 1) % PROTAGONISTAS.length)}>
        <div className="cursor-pointer group relative bg-neutral-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl transition-all duration-500 hover:border-cyan-500/30">
          <div className="absolute right-[-10px] top-[-10px] w-48 h-48 pointer-events-none transition-transform duration-700 group-hover:scale-110">
            <GraphicIcon type={current.grafico} color={current.color} />
          </div>
          <div className="relative flex flex-col h-full min-h-[320px] justify-between">
            <div>
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-[10px] font-mono text-cyan-500 mb-1 tracking-[0.2em] uppercase opacity-60">Hitos_Tecnológicos</h2>
                  <div className="text-4xl font-black text-white tracking-tighter leading-none uppercase">{current.nombre}</div>
                </div>
                <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-cyan-500/10 transition-colors">
                  <ChevronRight className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-6">{current.titulo}</span>
                <p className="text-lg text-slate-300 leading-relaxed font-light">{current.descripcion}</p>
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-slate-600">Estado</span>
                  <span className="text-cyan-400 uppercase font-black">Verificado</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-slate-600">Id_Archivo</span>
                  <span className="text-slate-500 uppercase">Vsk-{current.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 flex gap-2 justify-center">
          {PROTAGONISTAS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-cyan-500' : 'w-2 bg-white/10'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

// --- LANDING PAGE PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('home');

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#39FF14]/30 overflow-x-hidden">
      {view === 'tuner' && <VostokTuner onBack={() => setView('home')} />}

      <nav className="fixed top-0 w-full z-40 px-8 py-6 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <VostokLogo className="w-10 h-10" />
          <span className="text-xl font-black tracking-tighter uppercase tracking-widest">Vostok<span className="font-light opacity-60">Labs</span></span>
        </div>
        <button className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] relative active:scale-95 transition-transform">
          Contacto
        </button>
      </nav>

      {/* HERO SECTION - ESTÉTICA RESTAURADA */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center px-8 text-center relative pt-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#39FF14]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-5xl flex flex-col items-center">
          <div className="inline-block px-5 py-2 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[10px] font-black uppercase tracking-[0.5em] mb-12 italic">Analog Audio Laboratory</div>
          <h1 className="text-6xl md:text-[7.5rem] font-black tracking-tighter leading-[0.85] mb-12 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 drop-shadow-2xl uppercase">
            Redefiniendo el <br/> Audio Digital
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-4xl mx-auto mb-16 font-medium leading-relaxed tracking-tight border-x border-white/5 px-10">
            Creamos herramientas de precisión de grado de estudio con interfaces táctiles que inspiran la creación musical.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto mt-6">
            <button 
              onClick={() => setView('tuner')} 
              className="px-14 py-7 bg-black/60 border border-[#39FF14] text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-5 hover:scale-105 transition-all shadow-[0_0_40px_rgba(57,255,20,0.2)] hover:shadow-[0_0_60px_rgba(57,255,20,0.4)] active:scale-95 group uppercase tracking-[0.2em]"
            >
              <TuningForkIcon className="w-6 h-6 text-[#39FF14]" />
              VOSTOK TUNER
            </button>
            <a href="#ecosistema" className="px-12 py-7 bg-white/5 border border-white/10 rounded-[2rem] font-black text-sm hover:bg-white/10 transition-all flex items-center justify-center active:scale-95 uppercase tracking-[0.2em]">Ecosistema</a>
          </div>
        </div>
      </section>

      {/* SECCIÓN GENEALOGÍA */}
      <SoundScienceSection />

      {/* SECCIÓN ECOSISTEMA */}
      <section id="ecosistema" className="py-24 relative px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 flex flex-col items-center">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-12 text-white uppercase tracking-[0.1em]">El Ecosistema</h2>
            <div className="max-w-3xl">
              <p className="text-slate-400 text-2xl font-medium leading-relaxed italic">
                "El afinador es solo el comienzo"
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 mt-6">— Vostok Lab</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: "Vostok Metronome", d: "Polirritmias y setlists inteligentes. El motor de tiempo definitivo.", s: "En Desarrollo", c: "#A855F7", i: Zap },
              { t: "Vostok Spectrum", d: "Analizador de espectro 3D. Entiende el sonido en todas sus dimensiones.", s: "Fase Alpha", c: "#3B82F6", i: Waves },
              { t: "Vostok 4-Track", d: "Grabadora multipista minimalista inspirada en la era analógica.", s: "Próximamente", c: "#F97316", i: Headphones }
            ].map((app, i) => {
              const AppIcon = app.i;
              return (
                <div key={i} className="p-10 rounded-[3rem] bg-[#080808] border border-white/5 hover:border-[#39FF14]/20 transition-all group flex flex-col">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-10 border transition-transform group-hover:scale-110" style={{ backgroundColor: `${app.c}10`, borderColor: `${app.c}20` }}>
                    <AppIcon className="w-6 h-6" style={{ color: app.c }} />
                  </div>
                  <h3 className="text-xl font-black text-white mb-6 tracking-widest uppercase">{app.t}</h3>
                  <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium uppercase tracking-tight">{app.d}</p>
                  <div className="mt-auto inline-flex self-start px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border" style={{ backgroundColor: `${app.c}10`, color: app.c, borderColor: `${app.c}20` }}>{app.s}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 border-t border-white/5 px-8 bg-black">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20">
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="flex items-center gap-3"><VostokLogo className="w-12 h-12" /><span className="text-3xl font-black tracking-tighter text-white uppercase tracking-widest">Vostok Labs</span></div>
            <p className="text-slate-800 text-[10px] font-black uppercase tracking-[0.4em] mt-4 uppercase">Laboratorio de Acústica Aplicada © 2026</p>
          </div>
          <div className="relative p-12 flex flex-col gap-8 border border-white/5 rounded-[4rem]">
            <div className="flex items-center gap-4">
              <BellRing className="w-6 h-6 text-[#39FF14]/60" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#39FF14]/80">Buzón de Experimentación</h4>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed italic text-center md:text-left">"Envíenos sus observaciones acústicas. Nuestra comunidad construye el futuro del audio."</p>
            <div className="h-14 bg-white/5 rounded-full border border-white/10 flex items-center px-6">
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">Inactivo en Fase Beta</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}