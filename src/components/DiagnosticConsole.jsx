import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Activity, Cpu, Zap, Waves } from 'lucide-react';
import { runMuseBenchmark } from '../lib/muse-benchmark';

export default function DiagnosticConsole({ onClose, currentView }) {
  const [metrics, setMetrics] = useState({
    sampleRate: 0,
    baseLatency: 0,
    state: 'N/A',
    memory: 0
  });

  useEffect(() => {
    // Capturar métricas iniciales del contexto de audio
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      setMetrics(m => ({
        ...m,
        sampleRate: ctx.sampleRate,
        baseLatency: (ctx.baseLatency || 0) * 1000,
        state: ctx.state
      }));
      ctx.close();
    } catch (e) {
      console.warn("AudioContext test failed", e);
    }

    // Actualización en tiempo real de la memoria (Chrome/Brave)
    const interval = setInterval(() => {
      if (performance && performance.memory) {
        setMetrics(m => ({
          ...m,
          memory: performance.memory.usedJSHeapSize / (1024 * 1024)
        }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getToolName = () => {
    switch(currentView) {
        case 'tuner': return 'Tuner';
        case 'tempo': return 'TempoSense';
        case 'spectrum': return 'Spectrum';
        case 'spl': return 'SPL Meter';
        default: return 'System';
    }
  };

  const handleRunBenchmark = () => {
    runMuseBenchmark(currentView);
    alert(`Stress Test [${getToolName()}] iniciado. Revisa la consola de Brave (F12) para ver los resultados.`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 right-4 z-[999] w-80 bg-black/95 backdrop-blur-3xl border border-[#39FF14]/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(57,255,20,0.15)] font-mono text-white"
    >
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 text-[#39FF14]">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">DSP Diagnostics [{getToolName()}]</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-widest flex items-center gap-1"><Cpu className="w-3 h-3" /> Sample Rate</span>
          <span className="text-xs font-bold text-[#39FF14]">{metrics.sampleRate} Hz</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-widest flex items-center gap-1"><Zap className="w-3 h-3" /> Hardware Latency</span>
          <span className="text-xs font-bold text-cyan-400">{metrics.baseLatency.toFixed(2)} ms</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-widest flex items-center gap-1"><Waves className="w-3 h-3" /> Heap Memory</span>
          <span className="text-xs font-bold text-white">{metrics.memory > 0 ? `${metrics.memory.toFixed(1)} MB` : 'N/A'}</span>
        </div>
      </div>

      <button 
        onClick={handleRunBenchmark}
        className="w-full py-2 bg-[#39FF14]/10 border border-[#39FF14]/30 hover:bg-[#39FF14]/20 text-[#39FF14] rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
      >
        Run {getToolName()} Stress Test
      </button>
    </motion.div>
  );
}
