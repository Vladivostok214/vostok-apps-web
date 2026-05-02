import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, Check, Settings, Upload, Waves, X, ChevronRight, 
  Smartphone, LayoutGrid, Plus, Minus, Disc, Radio, Target, 
  Brain, ArrowRight, BellRing, MousePointer2, ArrowLeft, Music, Headphones, Zap, Info, Cpu, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTE: ICONO DIAPASÓN (SÍMBOLO OFICIAL) ---
const TuningForkIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22v-8" />
    <path d="M8 14V4" />
    <path d="M16 14V4" />
    <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4" />
  </svg>
);

// --- LOGO OFICIAL VOSTOK LABS (CONSISTENTE) ---
const VostokLogo = ({ className = "w-10 h-10" }) => (
  <div className={`${className} relative rounded-xl bg-[#050A05] flex items-center justify-center shadow-lg shadow-green-500/10 overflow-hidden border border-green-500/20 group`}>
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
    <TuningForkIcon className="w-6 h-6 text-[#39FF14] relative z-10 transition-transform group-hover:scale-110" />
  </div>
);

// --- DATOS HISTÓRICOS ---
const PROTAGONISTAS = [
  { id: 'pitagoras', nombre: 'PITÁGORAS', titulo: 'El Monocordio', descripcion: 'Descubrió que la armonía es matemática pura. Dividiendo una cuerda en radios exactos, estableció las bases de la escala musical occidental.', grafico: 'triangle', color: '#00f5ff' },
  { id: 'sauveur', nombre: 'JOSEPH SAUVEUR', titulo: 'Padre de la Acústica', descripcion: 'Fue el primero en calcular la frecuencia absoluta de un sonido y en identificar los nodos en cuerdas vibrantes.', grafico: 'nodes', color: '#00d1ff' },
  { id: 'chladni', nombre: 'ERNST CHLADNI', titulo: 'El Visualizador', descripcion: 'Reveló la geometría del sonido mostrando patrones visuales simétricos llamados líneas nodales.', grafico: 'symmetry', color: '#00b8ff' },
  { id: 'vostok', nombre: 'VOSTOK ENGINE', titulo: 'Super-Resolución IA', descripcion: 'Detección de tono mediante redes neuronales que filtran el ruido ambiente para una precisión quirúrgica.', grafico: 'ai', color: '#ffffff' }
];

const INSTRUMENTS = [
  { id: 'chromatic', name: 'Cromático', icon: Activity },
  { id: 'guitar', name: 'Guitarra', icon: Music },
  { id: 'bass', name: 'Bajo', icon: Waves },
  { id: 'ukulele', name: 'Ukelele', icon: Smartphone }
];

// --- GRÁFICOS CIENTÍFICOS ---
const GraphicIcon = ({ type, color }) => {
  const baseClass = "w-full h-full flex items-center justify-center opacity-40";
  switch (type) {
    case 'triangle':
      return <div className={baseClass}><svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" stroke={color} strokeWidth="1.5"><path d="M50 10 L90 90 L10 90 Z" /><circle cx="50" cy="10" r="2" fill={color} /></svg></div>;
    case 'nodes':
      return <div className={baseClass}><svg viewBox="0 0 100 40" className="w-32 h-16" fill="none" stroke={color} strokeWidth="1.5"><path d="M0 20 Q 25 0, 50 20 T 100 20" /><path d="M0 20 Q 25 40, 50 20 T 100 20" strokeDasharray="2 2" /></svg></div>;
    case 'symmetry':
      return <div className={baseClass}><svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" stroke={color} strokeWidth="1"><circle cx="50" cy="50" r="40" /><path d="M50 10 L50 90 M10 50 L90 50" /></svg></div>;
    case 'ai':
      return <div className={baseClass}><svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" stroke={color} strokeWidth="1.5"><circle cx="50" cy="50" r="10" fill={color} fillOpacity="0.2" /><circle cx="20" cy="30" r="4" fill={color} /><circle cx="80" cy="70" r="4" fill={color} /><line x1="24" y1="33" x2="42" y2="45" /><line x1="76" y1="67" x2="58" y2="55" /></svg></div>;
    default: return null;
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
  const [activePanel, setActivePanel] = useState('center');
  const [refPitch, setRefPitch] = useState(440);
  const [smoothValue, setSmoothValue] = useState(70); 
  const [selectedInstrument, setSelectedInstrument] = useState('chromatic');

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const rafIdRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setActivePanel('center');
    return () => stopListening();
  }, []);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      mediaStreamSourceRef.current.connect(analyserRef.current);
      setIsListening(true);
      updateLoop();
    } catch (e) { console.error(e); }
  };

  const stopListening = () => {
    cancelAnimationFrame(rafIdRef.current);
    if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
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
    }
    rafIdRef.current = requestAnimationFrame(updateLoop);
  };

  const note = targetMidi ? { n: noteStrings[targetMidi % 12], o: Math.floor(targetMidi / 12) - 1 } : { n: "-", o: "" };

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center overflow-hidden font-sans">
      <div className={`absolute inset-0 opacity-20 blur-[120px] transition-colors duration-1000 ${Math.abs(cents) < 5 ? 'bg-[#39FF14]' : 'bg-purple-600'}`} />

      {!isListening && (
        <div className="absolute inset-0 z-[150] bg-black flex flex-col items-center justify-center p-8 text-center" onClick={startListening}>
          <VostokLogo className="w-24 h-24 mb-10 animate-pulse" />
          <h2 className="text-4xl font-black mb-4 tracking-tighter text-white uppercase">Vostok Tuner</h2>
          <p className="text-slate-500 text-[10px] tracking-[0.2em] mb-12 uppercase">Toque para iniciar calibración analógica/digital</p>
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="py-3 px-10 border border-white/10 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white">Regresar</button>
        </div>
      )}

      <header className="w-full pt-14 px-8 flex justify-between items-start z-20">
        <div className="flex flex-col gap-3">
          <button onClick={() => setActivePanel('left')} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md">
            <LayoutGrid className="w-5 h-5 text-slate-400" />
          </button>
          <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="text-center mt-2 flex flex-col items-center">
          <div className="text-[9px] font-black text-[#39FF14] uppercase tracking-[0.4em] mb-2 opacity-60">Analog/Digital Master</div>
          <div className="text-5xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
            {pitch ? pitch.toFixed(1) : "000.0"}<span className="text-[12px] ml-2 text-[#39FF14]">Hz</span>
          </div>
          <div className="text-[8px] font-black text-slate-600 mt-2 tracking-[0.3em] uppercase">Ref: {refPitch}Hz</div>
        </div>
        <button onClick={() => setActivePanel('right')} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md">
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center z-10 w-full px-6">
        <div className="text-[10rem] md:text-[12rem] font-black leading-none tracking-tighter flex items-start text-white transition-all select-none">
          {note.n}<span className="text-3xl md:text-4xl font-black opacity-20 mt-8 md:mt-10 ml-2">{note.o}</span>
        </div>
        <div className={`mt-6 px-12 py-3 rounded-full border border-white/10 text-xl md:text-2xl font-black ${Math.abs(cents) < 5 ? 'text-[#39FF14] border-[#39FF14]/30 bg-[#39FF14]/5' : 'text-slate-700 bg-white/5'}`}>
          {pitch ? `${cents > 0 ? '+' : ''}${Math.round(cents)} Cents` : "-- Cents"}
        </div>
      </main>

      {/* Side Panels - Tray Aesthetic */}
      <AnimatePresence>
        {activePanel === 'left' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[180]" onClick={() => setActivePanel('center')} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-4 left-4 w-full max-w-[280px] bg-[#0A0A0A]/95 backdrop-blur-3xl z-[200] p-8 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Módulo</span>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Instrumentos</h3>
                </div>
                <button onClick={() => setActivePanel('center')} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <div className="grid gap-3 overflow-y-auto pr-2">
                {INSTRUMENTS.map(inst => {
                  const Icon = inst.icon;
                  const isActive = selectedInstrument === inst.id;
                  return (
                    <button key={inst.id} onClick={() => { setSelectedInstrument(inst.id); setActivePanel('center'); }} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all relative overflow-hidden group ${isActive ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-white shadow-[inset_0_0_20px_rgba(57,255,20,0.05)]' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'}`}>
                      <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-[#39FF14]' : ''}`} />
                      <span className="font-bold text-sm uppercase tracking-widest relative z-10">{inst.name}</span>
                      {isActive && <Check className="w-4 h-4 ml-auto text-[#39FF14] relative z-10" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto pt-6 border-t border-white/5 text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em] text-center italic">Digital Tools Laboratory</div>
            </motion.aside>
          </>
        )}

        {activePanel === 'right' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[180]" onClick={() => setActivePanel('center')} />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-4 right-4 w-full max-w-[320px] bg-[#0A0A0A]/95 backdrop-blur-3xl z-[200] p-10 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Calibración</span>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Ajustes</h3>
                </div>
                <button onClick={() => setActivePanel('center')} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
              </div>
              <div className="space-y-12 overflow-y-auto pr-2">
                <section>
                  <label className="text-[10px] font-black text-slate-600 mb-6 block uppercase tracking-[0.2em] border-l-2 border-[#39FF14] pl-3">Referencia A4</label>
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-full border border-white/10">
                    <button onClick={() => setRefPitch(p => p - 1)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center active:scale-90 transition-transform hover:bg-white/10"><Minus className="w-4 h-4" /></button>
                    <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{refPitch}<span className="text-xs text-slate-500 ml-1 font-normal">Hz</span></span>
                    <button onClick={() => setRefPitch(p => p + 1)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center active:scale-90 transition-transform hover:bg-white/10"><Plus className="w-4 h-4" /></button>
                  </div>
                </section>
                <section>
                  <div className="flex justify-between mb-6">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-l-2 border-[#39FF14] pl-3">Smoothing</label>
                    <span className="text-[10px] font-black text-[#39FF14] tabular-nums tracking-widest">{smoothValue}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={smoothValue} onChange={(e) => setSmoothValue(e.target.value)} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-[#39FF14] cursor-pointer" />
                </section>
                <section className="pt-8 border-t border-white/5 space-y-4">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 bg-purple-600/10 border border-purple-500/20 rounded-3xl text-[10px] font-black text-purple-400 uppercase tracking-widest hover:bg-purple-600/20 transition-all flex items-center justify-center gap-3 group">
                    <Upload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                    Calibrar Motor WAV
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" />
                </section>
              </div>
              <button onClick={() => setActivePanel('center')} className="mt-auto w-full py-5 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-3xl text-[10px] font-black text-[#39FF14] uppercase tracking-widest active:scale-95 transition-transform hover:bg-[#39FF14]/20">Regresar al Tuner</button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SECCIÓN: GENEALOGÍA DEL SONIDO (RESTAURADA) ---
function SoundScienceSection() {
  const [index, setIndex] = useState(0);
  const current = PROTAGONISTAS[index];

  return (
    <section className="py-32 px-6 md:p-12 bg-[#050505] flex flex-col items-center justify-center relative border-y border-white/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900 rounded-full blur-[120px]" />
      </div>
      <div className="mb-16 text-center z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]" />
          <span className="text-[10px] uppercase tracking-[0.5em] text-cyan-500/80 font-bold">Vostok Archivo Histórico</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-light text-white uppercase tracking-tighter leading-tight">La Genealogía del <br/><span className="font-black text-cyan-400">Sonido</span></h2>
      </div>
      <div className="relative w-full max-w-xl z-10" onClick={() => setIndex((prev) => (prev + 1) % PROTAGONISTAS.length)}>
        <motion.div key={current.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="cursor-pointer group relative bg-neutral-900/40 border border-white/5 backdrop-blur-xl rounded-[3rem] p-12 transition-all hover:border-cyan-500/30 shadow-2xl">
          <div className="absolute right-[-20px] top-[-20px] w-56 h-56 pointer-events-none opacity-20 transition-transform group-hover:scale-110 group-hover:rotate-6">
            <GraphicIcon type={current.grafico} color={current.color} />
          </div>
          <div className="relative flex flex-col min-h-[320px] justify-between">
            <div>
              <h2 className="text-[10px] font-mono text-cyan-500 mb-4 tracking-[0.3em] uppercase opacity-60 italic">Hitos_Tecnológicos</h2>
              <div className="text-5xl font-black text-white leading-none uppercase mb-10 tracking-tighter">{current.nombre}</div>
              <span className="inline-block px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-8">{current.titulo}</span>
              <p className="text-xl text-slate-300 font-light leading-relaxed pl-6 border-l-2 border-cyan-500/20">{current.descripcion}</p>
            </div>
            <div className="pt-10 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
              <div className="flex gap-10">
                <div className="flex flex-col"><span className="text-slate-600 uppercase tracking-widest mb-1 font-bold">Estado</span><span className="text-cyan-400 font-black">Verificado</span></div>
                <div className="flex flex-col"><span className="text-slate-600 uppercase tracking-widest mb-1 font-bold">ID_Archivo</span><span className="text-slate-500">VSK-{current.id.toUpperCase()}</span></div>
              </div>
              <div className="p-3 bg-white/5 rounded-full group-hover:bg-cyan-500/10 transition-colors"><ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400" /></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// --- APP COMPONENT ---
export default function App() {
  const [view, setView] = useState('home');
  const [copied, setCopied] = useState(false);

  const handleContact = async () => {
    try {
      await navigator.clipboard.writeText('contacto@vostoklabs.audio');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = "contacto@vostoklabs.audio";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#39FF14]/30 overflow-x-hidden">
      {view === 'tuner' && <VostokTuner onBack={() => setView('home')} />}

      <nav className="fixed top-0 w-full z-40 px-8 py-6 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <VostokLogo className="w-10 h-10" />
          <span className="text-xl font-black tracking-tighter uppercase tracking-widest">Vostok<span className="font-light opacity-60">Labs</span></span>
        </div>
        <button onClick={handleContact} className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest relative active:scale-95 transition-all hover:bg-white/10">
          {copied ? '¡Copiado!' : 'Contacto'}
        </button>
      </nav>

      {/* Hero Section - Balanced Typography */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center px-8 text-center relative pt-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#39FF14]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-5xl flex flex-col items-center">
          <div className="inline-block px-5 py-2 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[10px] font-black uppercase tracking-[0.5em] mb-12 italic">Digital Tools Laboratory</div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-12 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 drop-shadow-2xl uppercase select-none">
            Redefiniendo el <br/> Audio Digital
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-16 font-medium leading-relaxed tracking-tight border-x border-white/5 px-10 select-none">
            Creamos herramientas de precisión de grado de estudio con interfaces táctiles que inspiran la creación musical.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto mt-6">
            <button onClick={() => setView('tuner')} className="px-14 py-7 bg-[#020502]/80 border-2 border-[#39FF14] text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-6 hover:scale-105 transition-all shadow-[0_0_50px_rgba(57,255,20,0.2)] active:scale-95 group uppercase tracking-[0.2em]">
              <TuningForkIcon className="w-6 h-6 text-[#39FF14]" />
              VOSTOK TUNER
            </button>
            <a href="#ecosistema" className="px-12 py-7 bg-white/5 border border-white/10 rounded-[2rem] font-black text-sm hover:bg-white/10 transition-all flex items-center justify-center active:scale-95 uppercase tracking-[0.2em]">Ecosistema</a>
          </div>
        </div>
      </section>

      <SoundScienceSection />

      <section id="ecosistema" className="py-32 relative px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 flex flex-col items-center">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-12 text-white uppercase tracking-[0.1em]">El Ecosistema</h2>
            <div className="max-w-3xl">
              <p className="text-slate-400 text-2xl font-medium leading-relaxed">"El afinador es solo el comienzo"</p>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 mt-8">— Vostok Lab</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { t: "Vostok Metronome", d: "Polirritmias y setlists inteligentes con sincronización estroboscópica.", s: "En Desarrollo", c: "#A855F7", i: Zap },
              { t: "Vostok Spectrum", d: "Analizador de espectro 3D táctil para ingeniería de mezclas.", s: "Fase Alpha", c: "#3B82F6", i: Waves },
              { t: "Vostok 4-Track", d: "Grabadora multipista minimalista inspirada en la era del cassette.", s: "Próximamente", c: "#F97316", i: Headphones }
            ].map((app, i) => {
              const Icon = app.i;
              return (
                <div key={i} className="p-12 rounded-[3.5rem] bg-[#080808] border border-white/5 hover:border-[#39FF14]/20 transition-all flex flex-col group">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-10 border transition-transform group-hover:scale-110" style={{ backgroundColor: `${app.c}10`, borderColor: `${app.c}20` }}>
                    <Icon className="w-6 h-6" style={{ color: app.c }} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-widest">{app.t}</h3>
                  <p className="text-slate-500 text-base mb-10 leading-relaxed font-medium uppercase">{app.d}</p>
                  <div className="mt-auto inline-flex self-start px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors" style={{ backgroundColor: `${app.c}10`, color: app.c, borderColor: `${app.c}20` }}>{app.s}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="py-32 px-8 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24">
          <div className="flex flex-col items-center md:items-start gap-8">
            <div className="flex items-center gap-4">
              <VostokLogo className="w-14 h-14" />
              <span className="text-4xl font-black tracking-tighter text-white uppercase tracking-widest">Vostok Labs</span>
            </div>
            <p className="text-slate-800 text-[11px] font-black uppercase tracking-[0.5em] mt-4 font-bold">Digital Tools Laboratory © 2026</p>
          </div>
          <div className="relative flex flex-col gap-8">
            <div className="p-14 border border-white/10 rounded-[4rem] bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-sm shadow-[0_0_60px_rgba(57,255,20,0.03)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#39FF14]/5 blur-[60px] rounded-full transition-all group-hover:bg-[#39FF14]/10" />
              <div className="flex items-center gap-5 mb-8 relative z-10">
                <BellRing className="w-7 h-7 text-[#39FF14]/70" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#39FF14]/90">Buzón de Experimentación</h4>
              </div>
              <p className="text-slate-400 text-base font-medium leading-relaxed mb-10 relative z-10 font-bold">"Envíenos sus observaciones acústicas. Nuestra comunidad construye el futuro del audio."</p>
              <div className="h-16 flex items-center justify-center border border-white/5 rounded-full bg-white/[0.03] relative z-10 group-hover:border-slate-800 transition-colors">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">Inactivo en Fase Beta</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}