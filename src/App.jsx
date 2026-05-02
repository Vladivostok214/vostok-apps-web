import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Check, Settings, ExternalLink, SlidersHorizontal, 
  Upload, Waves, X, ChevronRight, MessageSquare, Globe, 
  Cpu, Zap, Shield, Play
} from 'lucide-react';

// --- COMPONENTE: ICONO DIAPASÓN ---
const TuningForkIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22v-8"></path>
    <path d="M8 14V4"></path>
    <path d="M16 14V4"></path>
    <path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4"></path>
  </svg>
);

// --- CONSTANTES DE AFINACIÓN ---
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const INSTRUMENTS = {
  chromatic: { id: 'chromatic', name: 'Cromático', strings: [] },
  guitar: { id: 'guitar', name: 'Guitarra', strings: [
    { note: 'E2', midi: 40 }, { note: 'A2', midi: 45 }, { note: 'D3', midi: 50 }, 
    { note: 'G3', midi: 55 }, { note: 'B3', midi: 59 }, { note: 'E4', midi: 64 }
  ]},
  bass: { id: 'bass', name: 'Bajo', strings: [
    { note: 'E1', midi: 28 }, { note: 'A1', midi: 33 }, { note: 'D2', midi: 38 }, { note: 'G2', midi: 43 }
  ]},
  ukulele: { id: 'ukulele', name: 'Ukelele', strings: [
    { note: 'G4', midi: 67 }, { note: 'C4', midi: 60 }, { note: 'E4', midi: 64 }, { note: 'A4', midi: 69 }
  ]}
};

// --- ALGORITMO AUTO-CORRELATE ---
const autoCorrelate = (buf, sampleRate) => {
  let SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) { rms += buf[i] * buf[i]; }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;
  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buf[i]) < thres) { r1 = i; break; } }
  for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; } }
  buf = buf.slice(r1, r2);
  SIZE = buf.length;
  const c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) { c[i] = c[i] + buf[j] * buf[j + i]; }
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

// --- COMPONENTE: VOSTOK TUNER APP ---
function VostokTuner({ onBack }) {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [targetMidi, setTargetMidi] = useState(null);
  const [cents, setCents] = useState(0);
  const [selectedInstrument, setSelectedInstrument] = useState('chromatic');
  const [activePanel, setActivePanel] = useState('center');
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const rafIdRef = useRef(null);
  const tapeRef = useRef(null);
  const touchStartRef = useRef(null);

  const currentStatus = isListening && pitch !== null 
    ? (Math.abs(cents) <= 4 ? 'tuned' : Math.abs(cents) <= 15 ? 'close' : 'far') 
    : 'idle';

  // Gestos para móvil
  const handleTouchStart = (e) => { touchStartRef.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 80) {
      if (diff > 0) activePanel === 'center' ? setActivePanel('right') : setActivePanel('center');
      else activePanel === 'center' ? setActivePanel('left') : setActivePanel('center');
    }
    touchStartRef.current = null;
  };

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
    } catch (e) { alert("Micrófono requerido."); }
  };

  const stopListening = () => {
    cancelAnimationFrame(rafIdRef.current);
    if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    setIsListening(false);
    setPitch(null);
  };

  const updateLoop = () => {
    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, audioContextRef.current.sampleRate);
    if (freq !== -1) {
      const midi = 12 * (Math.log(freq / 440) / Math.log(2)) + 69;
      let target = Math.round(midi);
      if (selectedInstrument !== 'chromatic') {
        const strings = INSTRUMENTS[selectedInstrument].strings;
        target = strings.reduce((prev, curr) => Math.abs(curr.midi - midi) < Math.abs(prev.midi - midi) ? curr : prev).midi;
      }
      setCents((midi - target) * 100);
      setPitch(freq);
      setTargetMidi(target);
      if (tapeRef.current) tapeRef.current.style.transform = `translateX(-${(midi - 20) * 80 + 40}px)`;
    }
    rafIdRef.current = requestAnimationFrame(updateLoop);
  };

  const note = targetMidi ? { n: noteStrings[targetMidi % 12], o: Math.floor(targetMidi / 12) - 1 } : { n: "-", o: "" };

  return (
    <div className="fixed inset-0 bg-[#0B0F19] z-50 flex flex-col items-center touch-none overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className={`absolute inset-0 transition-opacity duration-1000 opacity-20 blur-[100px] ${currentStatus === 'tuned' ? 'bg-emerald-500' : 'bg-blue-600'}`} />
      
      {!isListening && (
        <div className="absolute inset-0 z-[100] bg-[#0B0F19] flex flex-col items-center justify-center p-8 text-center" onClick={startListening}>
          <div className="w-24 h-24 rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-8 animate-bounce"><TuningForkIcon className="w-12 h-12 text-blue-400" /></div>
          <h2 className="text-4xl font-black mb-4">Vostok Tuner</h2>
          <p className="text-slate-400 animate-pulse">Toca para iniciar calibración</p>
          <button onClick={(e) => {e.stopPropagation(); onBack();}} className="mt-12 text-slate-600 font-bold uppercase tracking-widest text-xs py-2 px-4 border border-white/5 rounded-full">Volver a Web</button>
        </div>
      )}

      <header className="w-full pt-14 px-6 flex justify-between items-center z-20">
        <button onClick={() => setActivePanel('left')} className="p-3 bg-white/5 rounded-full"><TuningForkIcon className="w-6 h-6 text-slate-400" /></button>
        <div className="text-center">
          <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Precisión Extrema</div>
          <div className="text-sm font-mono text-slate-500">{pitch ? pitch.toFixed(1) : "000.0"} Hz</div>
        </div>
        <button onClick={() => setActivePanel('right')} className="p-3 bg-white/5 rounded-full"><Settings className="w-6 h-6 text-slate-400" /></button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center z-10 w-full px-6">
        <div className="text-[12rem] font-black leading-none tracking-tighter flex items-start select-none">
          {note.n}<span className="text-4xl opacity-30 mt-6 ml-2">{note.o}</span>
        </div>
        <div className={`mt-6 px-8 py-2 rounded-full border text-lg font-bold transition-all ${currentStatus === 'tuned' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-transparent text-slate-500'}`}>
          {pitch ? `${cents > 0 ? '+' : ''}${Math.round(cents)} Cents` : "-- Cents"}
        </div>
      </main>

      <footer className="w-full h-40 relative overflow-hidden flex items-end justify-center pb-12 shrink-0">
        <div className="absolute left-1/2 bottom-12 w-1 h-14 -translate-x-1/2 z-20 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
        <div className="absolute left-1/2 bottom-12 flex items-end transition-transform duration-75 will-change-transform" ref={tapeRef}>
          {Array.from({length: 81}).map((_, i) => (
            <div key={i} className="w-[80px] flex flex-col items-center flex-shrink-0">
              <span className="text-[10px] text-slate-600 font-bold mb-3">{noteStrings[(i + 20) % 12]}</span>
              <div className={`w-0.5 rounded-full ${i % 12 === 0 ? 'h-8 bg-slate-500' : 'h-4 bg-slate-800'}`}></div>
            </div>
          ))}
        </div>
      </footer>

      {/* Paneles Laterales */}
      <aside className={`fixed inset-y-0 left-0 w-80 bg-[#0F172A] z-[200] p-8 transform transition-transform duration-300 ${activePanel === 'left' ? 'translate-x-0' : '-translate-x-full'}`}>
        <h3 className="text-2xl font-black mb-8">Instrumento</h3>
        <div className="space-y-3">
          {Object.values(INSTRUMENTS).map(inst => (
            <button key={inst.id} onClick={() => {setSelectedInstrument(inst.id); setActivePanel('center');}} className={`w-full text-left p-5 rounded-2xl font-bold ${selectedInstrument === inst.id ? 'bg-blue-600' : 'bg-white/5'}`}>{inst.name}</button>
          ))}
        </div>
      </aside>

      <aside className={`fixed inset-y-0 right-0 w-80 bg-[#0F172A] z-[200] p-8 transform transition-transform duration-300 ${activePanel === 'right' ? 'translate-x-0' : 'translate-x-full'}`}>
        <h3 className="text-2xl font-black mb-8">Ajustes</h3>
        <div className="space-y-4">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase">Licencia</p>
            <p className="font-bold">Pro Beta v1.2</p>
          </div>
          <button onClick={onBack} className="w-full p-5 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2">Salir del afinador</button>
        </div>
      </aside>
      
      {activePanel !== 'center' && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]" onClick={() => setActivePanel('center')} />}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL: LANDING PAGE + NAVIGATION ---
export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'tuner'
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animación de entrada para el afinador
  const openTuner = () => setView('tuner');

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* AFINADOR CONDICIONAL */}
      {view === 'tuner' && <VostokTuner onBack={() => setView('home')} />}

      {/* HEADER PERSISTENTE */}
      <nav className={`fixed top-0 left-0 right-0 z-[40] transition-all duration-500 px-6 py-4 flex items-center justify-between ${
        isScrolled ? 'bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
      }`}>
        <div className="flex items-center gap-2" onClick={() => setView('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-600/20 cursor-pointer">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter cursor-pointer">Vostok<span className="font-light opacity-60">Apps</span></span>
        </div>
        <button className="px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-semibold">
          Contacto
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        
        <div className="relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
            Nuevo Lanzamiento
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500">
            Redefiniendo el Audio Digital Móvil
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            Creamos herramientas de precisión de grado de estudio con interfaces que inspiran. Nuestra misión es potenciar tu creatividad musical desde la palma de tu mano.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={openTuner}
              className="group relative w-full sm:w-auto px-10 py-5 bg-blue-600 rounded-2xl font-black text-lg transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              Descubrir Vostok Tuner
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-lg transition-all hover:bg-white/10 active:scale-95">
              Ver Ecosistema
            </button>
          </div>
        </div>

        {/* Floating Metrics Background */}
        <div className="absolute bottom-20 left-6 right-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { label: "Latencia", val: "< 10ms", icon: Zap },
            { label: "Precisión", val: "± 0.1c", icon: Cpu },
            { label: "Seguridad", val: "Sandbox", icon: Shield },
            { label: "Usuarios", val: "Beta 1.0", icon: Globe }
          ].map((m, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm flex flex-col items-center">
              <m.icon className="w-5 h-5 text-blue-500 mb-3" />
              <div className="text-xl font-bold">{m.val}</div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Waves className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold tracking-tighter">Vostok Apps</span>
            </div>
            <p className="text-slate-500 max-w-sm mb-8">
              Innovación sonora desarrollada para músicos exigentes. Únete a la revolución del audio móvil.
            </p>
            <div className="flex gap-4">
              <MessageSquare className="w-6 h-6 text-slate-600 hover:text-white transition-colors cursor-pointer" />
              <Globe className="w-6 h-6 text-slate-600 hover:text-white transition-colors cursor-pointer" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 p-8 rounded-[2.5rem] border border-blue-500/10">
            <h3 className="text-2xl font-bold mb-4">Únete a la beta privada</h3>
            <p className="text-slate-400 mb-6">Sé el primero en probar nuestras futuras herramientas de producción.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="tu@correo.com" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 focus:outline-none focus:border-blue-500 transition-colors" />
              <button className="bg-blue-600 px-6 py-3 rounded-xl font-bold">Suscribirme</button>
            </div>
          </div>
        </div>
        <div className="mt-20 text-center text-slate-700 text-xs font-medium uppercase tracking-[0.2em]">
          © 2026 Vostok Apps. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}