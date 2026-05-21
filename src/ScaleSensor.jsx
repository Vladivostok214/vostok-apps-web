import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SCALE_INTERVALS, 
  INSTRUMENTS,
  NOTE_NAMES,
  getNoteInfo,
  freqToMidi
} from './lib/vostok-music-db';
import { generateChallenge, mapNotesToFretboard } from './lib/scale-engine';
import { ArrowLeft, Check, ChevronRight, Play } from 'lucide-react';

const ScaleSensor = ({ onBack }) => {
  const [status, setStatus] = useState('SYS_IDLE');
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(3);
  
  const [challenge, setChallenge] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lockedNotes, setLockedNotes] = useState([]);
  
  // Selection States
  const [scaleType, setScaleType] = useState('PENTATONIC_MINOR');
  const [rootNote, setRootNote] = useState(45);
  const [instrument, setInstrument] = useState('GUITAR');
  const [octaves, setOctaves] = useState(2);
  
  const [showHints, setShowHints] = useState(false);
  
  // Dev & Feedback States
  const [debugLog, setDebugLog] = useState([]);
  const [currentFreq, setCurrentFreq] = useState(0);
  const [currentVol, setCurrentVol] = useState(0);
  
  // Audio Refs
  const audioCtxRef = useRef(null);
  const workletRef = useRef(null);
  const streamRef = useRef(null);
  const telemetryRef = useRef(null);
  const rafIdRef = useRef(null);
  const freqHistoryRef = useRef([]);
  const currentIndexRef = useRef(0);
  const hitCounterRef = useRef(0);
  const isLockingRef = useRef(false);

  const addLog = (msg) => {
    setDebugLog(prev => [msg, ...prev].slice(0, 5));
  };

  const isGuitar = instrument === 'GUITAR';

  // 1. Prepare (Countdown)
  const initCountdown = () => {
    const isGuitarMode = instrument === 'GUITAR';
    const rawNotes = generateChallenge(rootNote, scaleType, octaves, isGuitarMode);
    
    // Enrich notes with smart physical mapping
    const enrichedNotes = mapNotesToFretboard(rawNotes, INSTRUMENTS[instrument].tuning);
    
    setChallenge(enrichedNotes);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setLockedNotes([]);
    setStatus('SYS_COUNTDOWN');
    setCountdown(3);
  };

  // 2. Start (Audio)
  const startAudio = useCallback(async () => {
    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      await audioCtxRef.current.audioWorklet.addModule('/vostok-scale-processor.js');
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false, latencyHint: 'interactive' }
      });

      const source = audioCtxRef.current.createMediaStreamSource(streamRef.current);
      workletRef.current = new AudioWorkletNode(audioCtxRef.current, 'vostok-scale-processor');
      const sab = new SharedArrayBuffer(2 * 4);
      telemetryRef.current = new Float32Array(sab);
      workletRef.current.port.postMessage({ type: 'SET_TELEMETRY_SAB', sab });

      const silentGain = audioCtxRef.current.createGain();
      silentGain.gain.value = 0;
      source.connect(workletRef.current);
      workletRef.current.connect(silentGain);
      silentGain.connect(audioCtxRef.current.destination);

      monitorTelemetery(challenge);
      setStatus('SYS_PLAYING');
      addLog("Sensor Activo");
    } catch (err) {
      addLog(`ERROR: ${err.message}`);
      setStatus('SYS_IDLE');
    }
  }, [challenge]);

  useEffect(() => {
    let timer;
    if (status === 'SYS_COUNTDOWN') {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      } else {
        startAudio();
      }
    }
    return () => clearTimeout(timer);
  }, [status, countdown, startAudio]);

  const stopAudio = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    streamRef.current = null;
    audioCtxRef.current = null;
    workletRef.current = null;
  }, []);

  const monitorTelemetery = (activeChallenge) => {
    if (!telemetryRef.current) return;

    const loop = () => {
      if (status === 'SYS_SUCCESS') return;

      const rawFreq = telemetryRef.current[0];
      const vol = telemetryRef.current[1];
      
      if (rawFreq > 20) {
        freqHistoryRef.current.push(rawFreq);
        if (freqHistoryRef.current.length > 5) freqHistoryRef.current.shift();
      } else {
        freqHistoryRef.current = [];
      }

      const sorted = [...freqHistoryRef.current].sort((a, b) => a - b);
      const freq = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

      setCurrentFreq(freq);
      setCurrentVol(vol);

      const idx = currentIndexRef.current;
      const targetNote = activeChallenge[idx];

      if (!isLockingRef.current && vol > 0.05 && freq > 20 && targetNote) {
        const { midi, cents } = freqToMidi(freq);
        if ((midi % 12) === (targetNote.midi % 12) && Math.abs(cents) <= 50) {
          hitCounterRef.current += 1;
          if (hitCounterRef.current >= 3) {
            lockNote(targetNote, cents, activeChallenge);
            freqHistoryRef.current = []; 
            hitCounterRef.current = 0;
          }
        } else {
          hitCounterRef.current = 0;
        }
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);
  };

  const lockNote = (note, deviation, activeChallenge) => {
    if (isLockingRef.current) return;
    isLockingRef.current = true;

    setLockedNotes(prev => [...prev, { ...note, deviation }]);
    addLog(`LOCKED: ${note.full}`);
    
    if (currentIndexRef.current + 1 >= activeChallenge.length) {
      setTimeout(() => {
          setStatus('SYS_SUCCESS');
          stopAudio();
          playSuccessArpeggio(activeChallenge);
          isLockingRef.current = false;
      }, 100);
    } else {
      currentIndexRef.current += 1;
      setCurrentIndex(currentIndexRef.current);
      setTimeout(() => { isLockingRef.current = false; }, 200); 
    }
  };

  const playSuccessArpeggio = (activeChallenge) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    activeChallenge.slice(-6).forEach((note, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.05, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now + i * 0.1);
      filter.frequency.exponentialRampToValueAtTime(100, now + i * 0.1 + 0.4);
      osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.4);
    });
    setTimeout(() => ctx.close(), 2000);
  };

  useEffect(() => { return () => stopAudio(); }, [stopAudio]);

  return (
    <div className="min-h-screen bg-[#020204] text-white font-mono p-4 md:p-8 flex flex-col relative overflow-hidden">
      {/* Dev Telemetry */}
      <div className="fixed bottom-4 left-4 z-[100] bg-black/80 border border-white/5 p-3 rounded-xl text-[9px] pointer-events-none opacity-40 backdrop-blur-md font-black">
        {debugLog.map((log, i) => <div key={i} className="text-[#39FF14]">{log}</div>)}
        <div className="mt-2 text-cyan-400 uppercase tracking-tighter">
          Hz: {currentFreq.toFixed(1)} | Vol: {(currentVol * 100).toFixed(1)}%
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none opacity-20 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

      <header className="mb-8 border-b border-[#39FF14]/30 pb-4 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#39FF14] tracking-tighter uppercase italic">Vostok Scale Sensor</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">ENTRENADOR DE ALTO RENDIMIENTO</p>
          </div>
        </div>
        <div className="flex gap-2 text-[10px]">
          <span className={`px-2 py-1 border font-black ${status === 'SYS_PLAYING' ? 'border-[#39FF14] text-[#39FF14] animate-pulse' : 'border-gray-700 text-gray-700'}`}>
            {status}
          </span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center relative z-10 w-full">
        
        {status === 'SYS_IDLE' && (
          <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-2 mb-12">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${step >= s ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10' : 'border-white/10 text-gray-700'}`}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-[8px] uppercase font-black tracking-widest ${step === s ? 'text-white' : 'text-gray-700'}`}>
                    {s === 1 ? 'Escala' : s === 2 ? 'Tónica' : 'Instrumento'}
                  </span>
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div className="grid grid-cols-1 gap-3 h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                  {Object.keys(SCALE_INTERVALS).map(key => (
                    <button 
                      key={key} onClick={() => { setScaleType(key); setStep(2); }}
                      className="group flex justify-between items-center p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-[#39FF14]/30 hover:bg-[#39FF14]/5 transition-all text-left"
                    >
                      <span className="text-sm font-black uppercase tracking-widest text-gray-400 group-hover:text-white">{key.replace('_', ' ')}</span>
                      <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-[#39FF14]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-300">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-center relative overflow-hidden">
                  <div className="text-7xl font-black text-[#39FF14] italic mb-8 glow-text select-none">{getNoteInfo(rootNote).name}</div>
                  <input 
                    type="range" min="40" max="64" value={rootNote} 
                    onChange={(e) => setRootNote(parseInt(e.target.value))}
                    className="w-full h-2 bg-black rounded-full accent-[#39FF14] cursor-pointer"
                  />
                  <div className="flex justify-between mt-4 text-[9px] text-gray-600 font-black uppercase tracking-widest">
                    <span>Grave</span>
                    <span>Medio</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 border border-white/10 text-gray-500 rounded-2xl font-black uppercase text-[10px]">Atrás</button>
                  <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-white/5 border border-[#39FF14]/30 text-[#39FF14] rounded-2xl font-black uppercase text-[10px]">Siguiente</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(INSTRUMENTS).map(key => (
                    <button 
                      key={key} onClick={() => { setInstrument(key); if (key === 'GUITAR' || key === 'BASS') setOctaves(INSTRUMENTS[key].defaultOctaves); }}
                      className={`p-5 rounded-2xl border transition-all text-center ${instrument === key ? 'border-[#39FF14] bg-[#39FF14]/10 text-[#39FF14]' : 'border-white/5 bg-white/5 text-gray-600'}`}
                    >
                      <div className="text-[10px] font-black uppercase">{INSTRUMENTS[key].name}</div>
                    </button>
                  ))}
                </div>
                <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                   <span className="text-[10px] font-black text-gray-500 uppercase">Octavas</span>
                   <div className="flex gap-2">
                     {[1, 2, 3].map(o => (
                       <button key={o} onClick={() => setOctaves(o)} className={`w-10 h-10 rounded-full font-black text-xs border ${octaves === o ? 'bg-[#39FF14] text-black' : 'border-white/10 text-gray-500'}`}>{o}</button>
                     ))}
                   </div>
                </div>
                <button 
                  onClick={initCountdown}
                  className="w-full py-6 bg-[#39FF14] text-black rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(57,255,20,0.3)] flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Iniciar Entrenamiento
                </button>
                <button onClick={() => setStep(2)} className="w-full text-[9px] text-gray-700 font-black uppercase tracking-widest hover:text-white">Atrás</button>
              </div>
            )}
          </div>
        )}

        {status === 'SYS_COUNTDOWN' && (
          <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <div className="text-[120px] font-black italic text-[#39FF14] glow-text leading-none">{countdown}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-[0.5em] mt-8 font-black">Prepárate...</div>
            <div className="mt-12 text-sm font-bold text-white/40 uppercase tracking-widest text-center">
                {instrument} • {scaleType.replace('_', ' ')}<br/>{getNoteInfo(rootNote).name}
            </div>
          </div>
        )}

        {status === 'SYS_PLAYING' && (
          <div className="flex flex-col items-center justify-center space-y-12 animate-in zoom-in-95 duration-500 w-full">
            <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-1 h-6 items-end">
              {Array.from({length: 12}).map((_, i) => (
                <div key={i} className="w-1 bg-[#39FF14] transition-all duration-75" style={{ height: `${Math.min(100, Math.max(5, currentVol * 400 * (0.5 + Math.random() * 0.5)))}%`, opacity: currentVol > 0.05 ? 0.8 : 0.1 }} />
              ))}
            </div>
            
            <div className="relative w-80 h-80 flex items-center justify-center">
              <div className="absolute inset-0 border border-[#39FF14]/10 rounded-full transition-transform duration-75" style={{ transform: `scale(${1 + (currentVol * 1.2)})` }}></div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="160" cy="160" r="145" fill="none" stroke="rgba(57, 255, 20, 0.03)" strokeWidth="1" />
                <circle 
                  cx="160" cy="160" r="145" fill="none" stroke="#39FF14" strokeWidth="4" 
                  strokeDasharray={911}
                  strokeDashoffset={911 - (911 * (lockedNotes.length / (challenge?.length || 1)))}
                  className="transition-all duration-500 ease-out"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(57, 255, 20, 0.4))' }}
                />
              </svg>

              <div className="text-center relative z-10">
                <div className="text-[11px] text-[#39FF14] uppercase font-black tracking-[0.4em] mb-4 bg-[#39FF14]/10 px-4 py-1 rounded-full border border-[#39FF14]/20 animate-pulse italic">
                  Toca: {challenge?.[currentIndex]?.full}
                </div>
                <div className="text-8xl font-black italic tracking-tighter text-[#39FF14] glow-text">{lockedNotes.length}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-[0.4em] mt-2 font-black">Notas / {challenge?.length}</div>
              </div>
            </div>

            <div className="absolute bottom-24 flex flex-col items-center gap-2">
                <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Afinación Actual</div>
                <div className={`text-2xl font-black italic ${currentFreq > 0 ? 'text-white' : 'text-white/10'}`}>
                  {currentFreq > 0 ? freqToMidi(currentFreq).cents : '0'} <span className="text-[10px] not-italic text-gray-500 uppercase">cents</span>
                </div>
            </div>

            <div className="absolute top-0 right-0 p-4">
              <button 
                onMouseEnter={() => setShowHints(true)}
                onMouseLeave={() => setShowHints(false)}
                onClick={() => setShowHints(!showHints)}
                className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-[#39FF14] hover:border-[#39FF14]/30 transition-all backdrop-blur-md"
              >
                <div className="text-xs font-black italic">?</div>
              </button>
            </div>

            {showHints && isGuitar && (
              <div className="absolute top-16 right-4 z-[200] bg-black/95 backdrop-blur-xl border border-[#39FF14]/20 p-5 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                  <div className="text-[9px] font-black text-[#39FF14] uppercase tracking-widest italic">
                    Esquema de Posición
                  </div>
                  <div className="text-[9px] font-black text-white bg-[#39FF14]/20 px-2 py-0.5 rounded border border-[#39FF14]/30">
                    Traste {Math.min(...challenge.map(n => n.positions[0]?.fret || 99))}
                  </div>
                </div>
                
                <div className="relative w-64 h-32 flex items-center justify-center">
                  <svg viewBox="0 0 240 160" className="w-full h-full opacity-100">
                    <rect x="0" y="0" width="240" height="160" fill="rgba(255,255,255,0.03)" rx="4" />
                    
                    {/* Frets (Expanded to 6 frets for 3NPS patterns) */}
                    {[0, 40, 80, 120, 160, 200, 240].map((x, i) => (
                      <line key={i} x1={x} y1="0" x2={x} y2="160" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    ))}
                    
                    {/* Strings */}
                    {Array.from({length: 6}).map((_, i) => (
                      <line 
                        key={i} 
                        x1="0" y1={15 + i * 26} x2="240" y2={15 + i * 26} 
                        stroke="rgba(255,255,255,0.2)" 
                        strokeWidth={0.5 + (i * 0.4)} 
                      />
                    ))}

                    {/* Scale Pattern (Static & Clear) */}
                    {challenge?.map((note, i) => {
                      const pos = note.positions[0];
                      if (!pos) return null;
                      
                      const minFret = Math.min(...challenge.map(n => n.positions[0]?.fret || 99));
                      const localFret = pos.fret - minFret + 1;

                      return (
                        <circle 
                          key={i}
                          cx={localFret * 40 - 20} 
                          cy={15 + (pos.string - 1) * 26} 
                          r={7} 
                          fill="#39FF14"
                          style={{ filter: 'drop-shadow(0 0 5px rgba(57, 255, 20, 0.6))' }}
                        />
                      );
                    })}
                  </svg>
                </div>
                <div className="mt-3 text-center">
                   <div className="text-[8px] text-gray-600 uppercase font-black tracking-[0.2em]">Referencia Estática Vostok</div>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'SYS_SUCCESS' && (
          <div className="w-full max-w-2xl space-y-8 animate-in slide-in-from-bottom duration-700">
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-1 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-[9px] font-black uppercase tracking-[0.3em] rounded-full mb-4 italic">Misión Cumplida</div>
              <h2 className="text-6xl font-black text-[#39FF14] glow-text italic uppercase tracking-tighter leading-none">Sesión<br/>Finalizada</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-white/5 p-6 bg-white/5 rounded-3xl backdrop-blur-md">
                <h3 className="text-[10px] text-gray-500 mb-6 uppercase font-black border-b border-white/5 pb-2 tracking-widest">Telemetría Fina</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {lockedNotes.map((note, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold uppercase tracking-widest">[{note.full}]</span>
                      <span className={`font-black ${Math.abs(note.deviation) < 5 ? 'text-[#39FF14]' : 'text-yellow-500'}`}>{note.deviation > 0 ? '+' : ''}{note.deviation} cents</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-white/5 p-6 bg-white/5 rounded-3xl backdrop-blur-md flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] text-gray-500 mb-6 uppercase font-black border-b border-white/5 pb-2 tracking-widest">Configuración</h3>
                  <div className="text-[10px] space-y-4 font-black uppercase tracking-widest">
                    <div className="flex justify-between"><span className="text-gray-600">Escala</span><span className="text-[#39FF14] italic">{scaleType.replace('_', ' ')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Tónica</span><span className="text-white">{getNoteInfo(rootNote).name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Instrumento</span><span className="text-white">{instrument}</span></div>
                  </div>
                </div>
                <button onClick={() => { setStatus('SYS_IDLE'); setStep(1); }} className="w-full mt-8 py-5 bg-[#39FF14] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all">Nueva Sesión</button>
              </div>
            </div>
          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .glow-text { text-shadow: 0 0 20px rgba(57, 255, 20, 0.4); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(57, 255, 20, 0.3); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default ScaleSensor;
