import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Square, Target, Activity, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TempoSense({ onBack, onOpenRadar }) {
  const [bpm, setBpm] = useState(120);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [tapTimes, setTapTimes] = useState([]);
  const [visualPulse, setVisualPulse] = useState(false);

  const audioContext = useRef(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef(null);

  const playClick = useCallback(() => {
    if (!audioContext.current) return;
    const osc = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();
    osc.connect(gain);
    gain.connect(audioContext.current.destination);

    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.5, audioContext.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);

    osc.start();
    osc.stop(audioContext.current.currentTime + 0.1);

    setVisualPulse(true);
    setTimeout(() => setVisualPulse(false), 100);
  }, []);

  const scheduler = useCallback(() => {
    function loop() {
      if (!audioContext.current) return;
      while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
        playClick();
        nextNoteTime.current += 60.0 / bpm;
      }
      timerID.current = requestAnimationFrame(loop);
    }
    loop();
  }, [bpm, playClick]);

  useEffect(() => {
    if (isMetronomeActive) {
      if (!audioContext.current) audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.current.state === 'suspended') audioContext.current.resume();
      nextNoteTime.current = audioContext.current.currentTime;
      scheduler();
    } else {
      cancelAnimationFrame(timerID.current);
    }
    return () => cancelAnimationFrame(timerID.current);
  }, [isMetronomeActive, bpm, scheduler]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(timerID.current);
      if (audioContext.current && audioContext.current.state !== 'closed') audioContext.current.close();
    };
  }, []);

  const handleTap = () => {
    const now = Date.now();
    let newTapTimes = tapTimes.filter(t => now - t < 2000);
    newTapTimes.push(now);

    if (newTapTimes.length > 2) {
      const diffs = [];
      for (let i = 1; i < newTapTimes.length; i++) {
          const d = newTapTimes[i] - newTapTimes[i-1];
          if (d > 200) diffs.push(d);
      }
      if (diffs.length > 0) {
        const avg = diffs.reduce((a, b) => a + b) / diffs.length;
        setBpm(Math.round(60000 / avg));
      }
    }
    setTapTimes(newTapTimes);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col font-sans text-white p-8 pt-[max(2rem,env(safe-area-inset-top))] crt-scanlines">
      <header className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all"><ArrowLeft className="w-5 h-5 text-gray-400" /></button>
        <div className="text-center">
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#39FF14]">TempoSense</h2>
            <p className="text-[6px] text-slate-500 uppercase tracking-widest mt-1 italic">Rhythmic Analysis Engine</p>
        </div>
        <div className="w-11" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-12">
        <div className="text-center relative">
            <motion.div 
                key={bpm}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10"
            >
                <div className="text-[10rem] font-black tabular-nums tracking-tighter leading-none italic">
                    {bpm}<span className="text-2xl text-[#39FF14] font-light ml-2 uppercase not-italic">BPM</span>
                </div>
            </motion.div>
            <motion.div 
                animate={{ scale: visualPulse ? 1.4 : 1, opacity: visualPulse ? 0.3 : 0 }}
                className="absolute inset-0 bg-[#39FF14] rounded-full blur-[100px] pointer-events-none"
            />
        </div>

        <div className="flex flex-col gap-6 w-full max-w-xs">
          <button onPointerDown={handleTap} className="w-full py-16 bg-white/5 border border-white/10 rounded-[3rem] active:scale-95 transition-all text-center flex flex-col items-center gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#39FF14]/5 opacity-0 group-active:opacity-100 transition-opacity" />
            <Target className="w-12 h-12 text-[#39FF14]" />
            <span className="font-black tracking-[0.4em] uppercase text-[10px] text-white/40">Tap Rhythm</span>
          </button>
          
          <div className="grid grid-cols-1 gap-3">
              <button onClick={() => setIsMetronomeActive(!isMetronomeActive)} className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 ${isMetronomeActive ? 'bg-red-500/20 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20'}`}>
                {isMetronomeActive ? <><Square className="w-4 h-4 fill-current" /> Detener</> : <><Play className="w-4 h-4 fill-current" /> Iniciar Metrónomo</>}
              </button>
              
              <button onClick={onOpenRadar} className="w-full py-4 border border-white/5 text-slate-600 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[8px] hover:text-[#39FF14] transition-all">
                <Waves className="w-3 h-3" />
                Analizar Armonía (Radar)
              </button>
          </div>
        </div>
      </main>

      <footer className="mt-auto flex justify-between items-end opacity-40 text-[8px] font-black uppercase tracking-widest border-t border-white/5 pt-6">
        <span>Vostok_Rhythm_v2.0</span>
        <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-[#39FF14]" />
            <span>Clock: High-Res Quartz</span>
        </div>
      </footer>
    </div>
  );
}
