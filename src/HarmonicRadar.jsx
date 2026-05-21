import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Activity, Info, BarChart3, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCALE_INTERVALS, NOTE_NAMES } from './lib/vostok-music-db';
import { useWakeLock } from './lib/vostok-hooks';

const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

const HarmonicRadar = ({ onBack }) => {
  const [status, setStatus] = useState('SYS_IDLE'); // IDLE, ACTIVE, REPORT
  const [chromaEnergy, setChromaEnergy] = useState(new Float32Array(12));
  const [analysisData, setAnalysisData] = useState({ root: null, notes: [], mode: 'LISTENING...' });
  const [reportData, setReportData] = useState(null);
  
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafIdRef = useRef(null);
  const chromaBufferRef = useRef(new Float32Array(12));
  const accumulatedChromaRef = useRef(new Float32Array(12));
  const sessionEnergyRef = useRef(new Float32Array(12)); 
  const frameCountRef = useRef(0);
  
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  const startAnalysis = async () => {
    setReportData(null);
    accumulatedChromaRef.current.fill(0);
    sessionEnergyRef.current.fill(0);
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
      });

      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 16384;
      source.connect(analyserRef.current);

      setStatus('SYS_ACTIVE');
      requestWakeLock();
      updateLoop();
    } catch (err) {
      console.error('Harmonic Radar failed:', err);
      setStatus('SYS_IDLE');
    }
  };

  const generateReport = () => {
    const finalChroma = sessionEnergyRef.current;
    const sorted = Array.from(finalChroma).map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v);
    const tonicIdx = sorted[0].i;
    const tonic = NOTE_NAMES[tonicIdx];

    let maxE = sorted[0].v;
    const allNotes = Array.from(finalChroma).map((v, i) => ({
      name: NOTE_NAMES[i],
      energy: (v / (maxE || 1)) * 100,
      raw: v
    })).sort((a, b) => b.energy - a.energy);

    let bestMode = "PITCH CLUSTER (Complex Harmony)";
    let maxScore = -Infinity;

    Object.keys(SCALE_INTERVALS).forEach(key => {
      const intervals = SCALE_INTERVALS[key];
      let score = 0;
      const normalizedChroma = finalChroma.map(v => v / (maxE || 1));
      intervals.forEach(interval => {
        score += normalizedChroma[(tonicIdx + interval) % 12] * 2.0;
      });
      const inScale = intervals.map(v => (tonicIdx + v) % 12);
      for(let i=0; i<12; i++) {
          if (!inScale.includes(i)) score -= normalizedChroma[i] * 1.5;
      }
      if (score > maxScore) {
        maxScore = score;
        bestMode = key.replace('_', ' ');
      }
    });

    setReportData({
      tonic,
      mode: bestMode,
      allNotes: allNotes.filter(n => n.energy > 5),
      score: Math.round(maxScore)
    });
    setStatus('SYS_REPORT');
  };

  const stopAnalysis = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    }
    releaseWakeLock();
    if (status === 'SYS_ACTIVE') {
      generateReport();
    } else {
      setStatus('SYS_IDLE');
    }
  }, [releaseWakeLock, status]);

  const updateLoop = () => {
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    const sampleRate = audioCtxRef.current.sampleRate;

    const loop = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getFloatFrequencyData(dataArray);
      chromaBufferRef.current.fill(0);

      for (let i = 0; i < bufferLength; i++) {
        const freq = i * sampleRate / (analyserRef.current.fftSize);
        if (freq < 40 || freq > 2000) continue; 
        const db = dataArray[i];
        if (db < -75) continue; 
        const energy = Math.pow(10, db / 20);
        const midi = 12 * Math.log2(freq / 440) + 69;
        const chroma = Math.round(midi) % 12;
        chromaBufferRef.current[chroma] += energy;
      }

      for(let i=0; i<12; i++) {
          accumulatedChromaRef.current[i] = (accumulatedChromaRef.current[i] * 0.96) + (chromaBufferRef.current[i] * 0.04);
          sessionEnergyRef.current[i] += chromaBufferRef.current[i] * 0.01;
      }

      frameCountRef.current++;
      if (frameCountRef.current % 6 === 0) {
        let maxEnergy = 0;
        for (let e of accumulatedChromaRef.current) if (e > maxEnergy) maxEnergy = e;
        const normalized = new Float32Array(12);
        if (maxEnergy > 0.001) {
          for (let i = 0; i < 12; i++) normalized[i] = accumulatedChromaRef.current[i] / maxEnergy;
        }
        setChromaEnergy(normalized);
        processHarmony(normalized);
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);
  };

  const processHarmony = (chroma) => {
    const activeNotes = [];
    let rootIdx = -1;
    let maxVal = 0;
    chroma.forEach((val, i) => {
      if (val > 0.35) activeNotes.push(NOTE_NAMES[i]);
      if (val > maxVal) {
        maxVal = val;
        rootIdx = i;
      }
    });
    if (maxVal < 0.1) {
        setAnalysisData({ root: null, notes: [], mode: 'LISTENING...' });
        return;
    }
    setAnalysisData({
      root: NOTE_NAMES[rootIdx],
      notes: activeNotes,
      mode: 'CAPTURING DATA...'
    });
  };

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return (
    <div className="fixed inset-0 bg-[#010101] z-[100] flex flex-col items-center overflow-hidden font-mono text-white">
      <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-20" />
      
      <AnimatePresence>
        {status === 'SYS_ACTIVE' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-hidden pointer-events-none">
             {CIRCLE_OF_FIFTHS.map((note, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x = 50 + Math.cos(angle) * 30;
                const y = 50 + Math.sin(angle) * 30;
                const chromaIdx = NOTE_NAMES.indexOf(note.replace('Gb', 'F#').replace('Db', 'C#').replace('Ab', 'G#').replace('Eb', 'D#').replace('Bb', 'A#'));
                const energy = chromaEnergy[chromaIdx] || 0;
                return (
                  <div key={note} className="absolute w-64 h-64 rounded-full blur-[80px] transition-opacity duration-1000"
                    style={{ left: `${x}%`, top: `${y}%`, backgroundColor: '#39FF14', opacity: energy * 0.5, transform: 'translate(-50%, -50%)' }} />
                );
             })}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="w-full pt-12 px-8 flex justify-between items-center z-20">
        <button onClick={onBack} className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-black text-[#39FF14] italic tracking-tighter uppercase">Harmonic Radar</h1>
            <p className="text-[9px] text-gray-500 tracking-[0.4em] uppercase font-black">Gravity Analysis Engine</p>
        </div>
        <div className="w-12" />
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center relative z-10 px-6">
        {status === 'SYS_IDLE' && (
          <div className="flex flex-col items-center gap-12 animate-in fade-in duration-700">
             <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-[#39FF14]/10 rounded-full animate-ping" />
                <Activity className="w-16 h-16 text-[#39FF14] opacity-20" />
             </div>
             <button onClick={startAnalysis} className="px-12 py-5 bg-[#39FF14] text-black rounded-full font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(57,255,20,0.3)]">
                Activar Escucha
             </button>
             <p className="text-[10px] text-gray-600 max-w-xs text-center uppercase tracking-widest leading-relaxed">
                El radar detectará la tónica y las notas componentes para identificar la estructura armónica.
             </p>
          </div>
        )}

        {status === 'SYS_ACTIVE' && (
          <div className="w-full max-w-2xl flex flex-col items-center gap-12">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-[0.4em]">Gravity Diagnostic</span>
                </div>
                <div className="text-8xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    {analysisData.root || '---'}
                </div>
                <div className="text-[11px] font-black text-[#39FF14]/60 uppercase tracking-[0.3em] italic">
                    {analysisData.mode}
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {analysisData.notes.map(n => (
                        <div key={n} className="px-4 py-1 bg-white/5 border border-[#39FF14]/20 rounded-full text-xs font-black text-[#39FF14] uppercase tracking-tighter shadow-[0_0_10px_rgba(57,255,20,0.1)]">
                            {n}
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative w-80 h-80 md:w-96 md:h-80 flex items-center justify-center">
              <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
                <circle cx="200" cy="200" r="140" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                {CIRCLE_OF_FIFTHS.map((note, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const x = 200 + Math.cos(angle) * 140;
                  const y = 200 + Math.sin(angle) * 140;
                  const chromaIdx = NOTE_NAMES.indexOf(note.replace('Gb', 'F#').replace('Db', 'C#').replace('Ab', 'G#').replace('Eb', 'D#').replace('Bb', 'A#'));
                  const energy = chromaEnergy[chromaIdx] || 0;
                  const isActive = energy > 0.35;
                  return (
                    <g key={note}>
                      <line x1="200" y1="200" x2={x} y2={y} stroke={isActive ? "#39FF14" : "rgba(255,255,255,0.05)"} strokeWidth={isActive ? 2 : 0.5} strokeDasharray={isActive ? "none" : "2 2"} />
                      <circle cx={x} cy={y} r={18} fill={isActive ? "#39FF14" : "#0A0A0A"} stroke={isActive ? "#39FF14" : "white"} strokeOpacity={isActive ? 1 : 0.1} className="transition-all duration-300" style={{ filter: isActive ? 'drop-shadow(0 0 10px #39FF14)' : 'none' }} />
                      <text x={x} y={y + 4} textAnchor="middle" className={`text-[12px] font-black pointer-events-none transition-colors duration-300 ${isActive ? 'fill-black' : 'fill-gray-600'}`}>{note}</text>
                      <circle cx={x} cy={y} r={18 + energy * 25} fill="none" stroke="#39FF14" strokeWidth="1" strokeOpacity={energy * 0.4} />
                    </g>
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-1 h-32 bg-gradient-to-t from-[#39FF14] to-transparent origin-bottom animate-spin-slow" />
              </div>
            </div>
            <button onClick={stopAnalysis} className="px-8 py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-500 hover:text-black transition-all active:scale-95">
                Detener y Generar Informe
            </button>
          </div>
        )}

        {status === 'SYS_REPORT' && reportData && (
            <div className="w-full max-w-2xl space-y-12 animate-in slide-in-from-bottom duration-700">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full">
                        <BarChart3 className="w-3 h-3 text-[#39FF14]" />
                        <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-widest">Informe de Gravedad Armónica</span>
                    </div>
                    <div className="text-[10rem] font-black italic text-white leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(57,255,20,0.2)]">
                        {reportData.tonic}
                    </div>
                    <div className="text-xl font-black text-[#39FF14] uppercase tracking-[0.3em] italic">
                        {reportData.mode}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-xl">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-6">Componentes Detectados</h3>
                        <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                            {reportData.allNotes.map(n => (
                                <div key={n.name} className="space-y-1.5">
                                    <div className="flex justify-between items-end text-[10px] font-black uppercase">
                                        <span className={n.energy > 50 ? 'text-[#39FF14]' : 'text-gray-400'}>{n.name}</span>
                                        <span className="text-gray-600 tracking-tighter">{Math.round(n.energy)}%</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${n.energy}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full ${n.energy > 50 ? 'bg-[#39FF14]' : 'bg-gray-700'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col justify-between gap-6">
                        <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                <Info className="w-12 h-12 text-[#39FF14]" />
                            </div>
                            <h4 className="text-[10px] font-black text-[#39FF14] uppercase tracking-widest mb-4 italic">Vostok Intelligence</h4>
                            <p className="text-sm text-gray-300 leading-relaxed font-light">
                                La estructura dominante sugiere un entorno de {reportData.mode}. 
                                El análisis confirma {reportData.tonic} como el centro de gravedad armónica.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={startAnalysis} className="w-full py-5 bg-[#39FF14] text-black rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 shadow-[0_0_25px_rgba(57,255,20,0.3)]">
                                <RotateCcw className="w-5 h-5" /> Re-Analizar
                            </button>
                            <button onClick={() => setStatus('SYS_IDLE')} className="w-full py-4 border border-white/10 text-gray-500 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-colors">Cerrar Sesión</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-spin-slow { animation: spin 5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default HarmonicRadar;
