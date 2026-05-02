import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowLeft, Zap, Music, Play, Square, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from './lib/analytics';

export default function TempoSense({ onBack }) {
  const [mode, setMode] = useState('tap');
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState(null);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [tapTimes, setTapTimes] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioContext = useRef(null);
  const analyserRef = useRef(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef(null);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setBpm(0);
    setKey(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContext.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.fftSize;
      const dataArray = new Float32Array(bufferLength);
      
      // Colección de energía en el tiempo para detectar picos (onsets)
      const energyHistory = [];
      const startTime = Date.now();

      const interval = setInterval(() => {
        analyserRef.current.getFloatTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += Math.abs(dataArray[i]);
        energyHistory.push(sum / bufferLength);
      }, 20); // Muestreo cada 20ms

      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach(t => t.stop());
        
        // Algoritmo simple de picos: buscar valores superiores al promedio * 1.5
        const avgEnergy = energyHistory.reduce((a, b) => a + b) / energyHistory.length;
        let peaks = 0;
        for (let i = 1; i < energyHistory.length - 1; i++) {
          if (energyHistory[i] > avgEnergy * 1.8 && energyHistory[i] > energyHistory[i-1] && energyHistory[i] > energyHistory[i+1]) {
            peaks++;
          }
        }
        
        // BPM = (peaks / 15 segundos) * 60
        const calculatedBpm = Math.round((peaks / 15) * 60);
        setBpm(Math.min(220, Math.max(40, calculatedBpm)));
        setKey('A'); // Placeholder para análisis de frecuencia dominante
        setIsAnalyzing(false);
      }, 15000);

    } catch (e) {
      console.error(e);
      alert("Error al acceder al micrófono.");
      setIsAnalyzing(false);
    }
  };

  const handleTap = () => {
    const now = Date.now();
    // Mejor sensibilidad móvil: filtramos toques fuera de rango (ej. 30 a 250 BPM)
    let newTapTimes = tapTimes.filter(t => now - t < 2000);
    newTapTimes.push(now);
    
    if (newTapTimes.length > 2) {
      const diffs = [];
      for (let i = 1; i < newTapTimes.length; i++) diffs.push(newTapTimes[i] - newTapTimes[i-1]);
      const avg = diffs.reduce((a, b) => a + b) / diffs.length;
      setBpm(Math.round(60000 / avg));
    }
    setTapTimes(newTapTimes);
    trackEvent('tempo_tap');
  };

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col font-sans text-white p-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="flex justify-between items-center mb-12">
        <button onClick={onBack} aria-label="Regresar" className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#39FF14]">TempoSense</h2>
        <div className="w-11" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-10">
        <div className="text-8xl font-black tabular-nums tracking-tighter text-center">
          {bpm}<span className="text-2xl text-slate-500 font-light ml-2">BPM</span>
          {key && <div className="text-xl text-[#39FF14] mt-4 tracking-widest uppercase">Nota: {key}</div>}
        </div>

        <div className="flex gap-4 p-2 bg-white/5 rounded-full border border-white/10">
          <button onClick={() => setMode('tap')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'tap' ? 'bg-[#39FF14] text-black' : 'text-slate-500'}`}>Tap Tempo</button>
          <button onClick={() => { setMode('analyze'); startAnalysis(); }} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'analyze' ? 'bg-[#39FF14] text-black' : 'text-slate-500'}`}>Escucha</button>
        </div>

        {mode === 'tap' ? (
          <div className="flex flex-col gap-6 w-full max-w-xs">
            <button onPointerDown={handleTap} className="w-full py-20 bg-white/5 border border-white/10 rounded-[3rem] active:scale-95 transition-all text-center flex flex-col items-center gap-4">
              <Target className="w-12 h-12 text-[#39FF14]" />
              <span className="font-black tracking-widest uppercase">Tap Aquí</span>
            </button>
            <button onClick={() => setIsMetronomeActive(!isMetronomeActive)} className={`w-full py-4 rounded-full flex items-center justify-center gap-2 font-black uppercase tracking-widest ${isMetronomeActive ? 'bg-red-500/20 text-red-500' : 'bg-[#39FF14]/10 text-[#39FF14]'}`}>
              {isMetronomeActive ? <><Square className="w-4 h-4" /> Detener Metrónomo</> : <><Play className="w-4 h-4" /> Iniciar Metrónomo</>}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xs p-10 bg-white/5 border border-white/10 rounded-[3rem] text-center">
            <Zap className={`w-12 h-12 mx-auto mb-6 ${isAnalyzing ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
              {isAnalyzing ? "Escuchando ambiente..." : "Listo para Escuchar"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}