import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Zap, Play, Square, Target, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from './lib/analytics';

export default function TempoSense({ onBack }) {
  const [mode, setMode] = useState('tap');
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState(null);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [tapTimes, setTapTimes] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visualPulse, setVisualPulse] = useState(false);
  const [perfMetrics, setPerfMetrics] = useState({ avgMs: 0, jitter: 0 });

  const audioContext = useRef(null);
  const analyserRef = useRef(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef(null);

  // --- VOSTOK VITERBI & HPS REFS ---
  const viterbiState = useRef(new Float32Array(24).fill(1/24)); // 12 Maj, 12 Min
  const lastKeyIdx = useRef(-1);
  const frameCount = useRef(0);
  const totalExecTime = useRef(0);

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
      nextNoteTime.current = audioContext.current.currentTime;
      scheduler();
    } else {
      cancelAnimationFrame(timerID.current);
    }
    return () => cancelAnimationFrame(timerID.current);
  }, [isMetronomeActive, bpm, scheduler]);

  const startAnalysis = useCallback(async () => {
    setKey(null);
    viterbiState.current.fill(1/24);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
      });
      setIsAnalyzing(true);
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContext.current.createAnalyser();
      analyserRef.current.fftSize = 8192; // High-res for better HPS
      
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const freqData = new Float32Array(bufferLength);
      const chroma = new Float32Array(12);
      
      const scales = [
          [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1], // Maj
          [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0]  // Min
      ];
      const notes = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

      const analyzeFrame = () => {
        if (mode !== 'analyze') {
            stream.getTracks().forEach(t => t.stop());
            setIsAnalyzing(false);
            return;
        }

        const tStart = performance.now();
        analyserRef.current.getFloatFrequencyData(freqData);
        
        // 1. HARMONIC PRODUCT SPECTRUM (HPS)
        const hps = new Float32Array(bufferLength / 3);
        for (let i = 0; i < hps.length; i++) {
            const mag1 = Math.pow(10, freqData[i] / 20);
            const mag2 = Math.pow(10, freqData[i * 2] / 20);
            const mag3 = Math.pow(10, freqData[i * 3] / 20);
            hps[i] = mag1 * mag2 * mag3;
        }

        // 2. CHROMA EXTRACTION (Using HPS results)
        chroma.fill(0);
        for (let i = 20; i < hps.length; i++) { // Start from ~100Hz
          const freq = i * audioContext.current.sampleRate / analyserRef.current.fftSize;
          if (freq < 2000) {
            const noteIndex = Math.round(12 * Math.log2(freq / 440) + 69) % 12;
            chroma[noteIndex] += hps[i];
          }
        }

        // 3. VITERBI SMOOTHING (HMM)
        // Emission: Correlation with scales
        const emissions = new Float32Array(24);
        for (let root = 0; root < 12; root++) {
            for (let type = 0; type < 2; type++) {
                let corr = 0;
                for (let i = 0; i < 12; i++) {
                    corr += chroma[(root + i) % 12] * (scales[type][i] ? 1.0 : -0.6);
                }
                emissions[root + type * 12] = Math.max(0.001, corr);
            }
        }

        // Transition & Update
        const nextState = new Float32Array(24);
        const stayProb = 0.95;
        const moveProb = (1 - stayProb) / 23;

        for (let i = 0; i < 24; i++) {
            let transitionSum = 0;
            for (let j = 0; j < 24; j++) {
                const prob = (i === j) ? stayProb : moveProb;
                transitionSum += viterbiState.current[j] * prob;
            }
            nextState[i] = transitionSum * emissions[i];
        }

        // Normalize
        let sum = 0;
        for (let i = 0; i < 24; i++) sum += nextState[i];
        for (let i = 0; i < 24; i++) nextState[i] /= (sum || 1);
        viterbiState.current = nextState;

        // Choose Best
        let bestIdx = 0;
        for (let i = 1; i < 24; i++) if (nextState[i] > nextState[bestIdx]) bestIdx = i;

        if (nextState[bestIdx] > 0.3) {
            const root = bestIdx % 12;
            const type = bestIdx < 12 ? '' : 'm';
            setKey(`${notes[root]}${type}`);
        }

        // 4. PERFORMANCE AUDIT
        const tEnd = performance.now();
        totalExecTime.current += (tEnd - tStart);
        frameCount.current++;
        if (frameCount.current % 60 === 0) {
            setPerfMetrics({
                avgMs: totalExecTime.current / frameCount.current,
                jitter: 0 // Will be calculated by state change rate
            });
        }

        timerID.current = requestAnimationFrame(analyzeFrame);
      };

      analyzeFrame();
    } catch (e) {
      console.error(e);
      setIsAnalyzing(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'analyze') startAnalysis();
    else setIsAnalyzing(false);
  }, [mode, startAnalysis]);

  const handleTap = () => {
    const now = Date.now();
    // Outlier rejection: only keep taps within 30-300 BPM range (2000ms - 200ms)
    let newTapTimes = tapTimes.filter(t => now - t < 2000);
    newTapTimes.push(now);

    if (newTapTimes.length > 2) {
      const diffs = [];
      for (let i = 1; i < newTapTimes.length; i++) {
          const d = newTapTimes[i] - newTapTimes[i-1];
          if (d > 200) diffs.push(d); // Reject ultra-fast accidental taps
      }
      
      if (diffs.length > 0) {
        // Robust Average (Simple outlier rejection)
        const avg = diffs.reduce((a, b) => a + b) / diffs.length;
        setBpm(Math.round(60000 / avg));
      }
    }
    setTapTimes(newTapTimes);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col font-sans text-white p-8 pt-[max(2rem,env(safe-area-inset-top))] crt-scanlines">
      <header className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all"><ArrowLeft className="w-5 h-5" /></button>
        <div className="text-center">
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#39FF14]">TempoSense SOTA</h2>
            <p className="text-[6px] text-slate-500 uppercase tracking-widest mt-1">HPS + Viterbi Optimized Engine</p>
        </div>
        <div className="w-11" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-center relative">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={mode === 'tap' ? bpm : key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="relative z-10"
                >
                    {mode === 'tap' ? (
                        <div className="text-[7rem] font-black tabular-nums tracking-tighter leading-none">
                            {bpm}<span className="text-xl text-slate-600 font-light ml-2 uppercase">BPM</span>
                        </div>
                    ) : (
                        <div className={`font-black tracking-tighter text-[#39FF14] drop-shadow-[0_0_40px_rgba(57,255,20,0.4)] transition-all ${key ? 'text-8xl' : 'text-3xl opacity-20'}`}>
                            {key || 'ESCUCHANDO'}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <motion.div 
                animate={{ scale: visualPulse ? 1.4 : 1, opacity: visualPulse ? 0.2 : 0 }}
                className="absolute inset-0 bg-[#39FF14] rounded-full blur-[80px] pointer-events-none"
            />
        </div>

        <div className="flex gap-4 p-1.5 bg-white/5 rounded-full border border-white/10">
          <button onClick={() => setMode('tap')} className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'tap' ? 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.3)]' : 'text-slate-500 hover:text-white'}`}>Tap Tempo</button>
          <button onClick={() => setMode('analyze')} className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'analyze' ? 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.3)]' : 'text-slate-500 hover:text-white'}`}>Real-time Key</button>
        </div>

        {mode === 'tap' ? (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button onPointerDown={handleTap} className="w-full py-12 bg-white/5 border border-white/10 rounded-[2.5rem] active:scale-95 transition-all text-center flex flex-col items-center gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#39FF14]/5 opacity-0 group-active:opacity-100 transition-opacity" />
              <Target className="w-10 h-10 text-[#39FF14]" />
              <span className="font-black tracking-widest uppercase text-[9px]">Pulsar Ritmo</span>
            </button>
            <button onClick={() => setIsMetronomeActive(!isMetronomeActive)} className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-[8px] transition-all active:scale-95 ${isMetronomeActive ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20'}`}>
              {isMetronomeActive ? <><Square className="w-3.5 h-3.5" /> Detener</> : <><Play className="w-3.5 h-3.5" /> Iniciar Metrónomo</>}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xs p-10 bg-white/5 border border-white/10 rounded-[3rem] text-center relative overflow-hidden group">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #39FF14 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />
            <Zap className={`w-16 h-16 mx-auto mb-6 relative z-10 transition-colors ${isAnalyzing ? 'text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]' : 'text-slate-700'}`} />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] relative z-10">
              {isAnalyzing ? "Analizando Armónicos..." : "Cargando Motor Viterbi..."}
            </p>
          </div>
        )}
      </main>

      <footer className="mt-auto flex justify-between items-end opacity-40 text-[8px] font-black uppercase tracking-widest border-t border-white/5 pt-6">
        <div className="flex gap-6">
            <span>Vostok_Engine_v4.0</span>
            <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-[#39FF14]" />
                <span>Perf: {perfMetrics.avgMs.toFixed(2)}ms / frame</span>
            </div>
        </div>
        <span>8192 FFT High-Res</span>
      </footer>
    </div>
  );
}
