import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pause, Play, Mic, RotateCw } from 'lucide-react';

export default function SpectrumAnalyzer({ onBack }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [peakFreq, setPeakFreq] = useState("----");

  // Persistent Refs for stable DSP and Rendering
  const canvasRef = useRef(null);
  const waterfallCanvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const animationRef = useRef(null);
  const dataArray = useRef(null);
  const peakArray = useRef(null);
  const decayArray = useRef(null); // Para detección de modos de sala
  const frameCounterRef = useRef(0);
  const hoverRef = useRef({ active: false, x: 0 });

  const resize = useCallback(() => {
    if (!canvasRef.current || !waterfallCanvasRef.current) return;
    const canvas = canvasRef.current;
    const wCanvas = waterfallCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    
    const wParent = wCanvas.parentElement;
    wCanvas.width = wParent.clientWidth * dpr;
    wCanvas.height = wParent.clientHeight * dpr;

    if (analyser.current) {
        peakArray.current = new Float32Array(Math.floor(canvas.width / dpr)).fill(0);
        decayArray.current = new Float32Array(Math.floor(canvas.width / dpr)).fill(0);
    }
  }, []);

  const draw = useCallback(() => {
    if (isFrozen || !canvasRef.current || !analyser.current) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const wCanvas = waterfallCanvasRef.current;
    const wCtx = wCanvas.getContext('2d', { alpha: false });
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    analyser.current.getByteFrequencyData(dataArray.current);
    
    // --- NOIR-TECH CANVAS STYLING ---
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Grid Milimétrica
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    const barCount = 128;
    const barWidth = width / barCount;
    const sampleRate = audioCtx.current.sampleRate;
    let frameMaxVal = -1;
    let frameMaxFreq = 0;

    for (let i = 0; i < barCount; i++) {
        const freq = (i / barCount) * (sampleRate / 2);
        let valRaw = dataArray.current[i];
        
        // 3. Compensación NRC (Noise/Response Compensation)
        // Aplanamos la curva del micro móvil: Boost sutil en extremos
        const nrcLow = freq < 150 ? (150 - freq) / 8 : 0;
        const nrcHigh = freq > 10000 ? (freq - 10000) / 800 : 0;
        let val = Math.min(255, valRaw + nrcLow + nrcHigh);
        
        const barHeight = Math.pow(val / 255, 1.4) * (height - 80);
        
        // Dynamic HSLA (Noir-Tech transition)
        const hue = 240 - (i / barCount) * 120; // Cyan to Blue
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
        ctx.fillRect(i * barWidth, height - barHeight - 40, barWidth - 1, barHeight);

        // Peak Hold Rendering
        if (val > peakArray.current[i]) peakArray.current[i] = val;
        else peakArray.current[i] -= 0.8; // Decaimiento suave REW
        
        const pH = Math.pow(peakArray.current[i] / 255, 1.4) * (height - 80);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(i * barWidth, height - pH - 42, barWidth - 1, 1.5);

        // 4. Detección de Modos de Sala (Room Modes)
        // Resaltar frecuencias con decaimiento persistente
        if (val > 150 && (peakArray.current[i] - val) < 3) {
            ctx.fillStyle = 'rgba(57, 255, 20, 0.08)';
            ctx.fillRect(i * barWidth, 0, barWidth, height - 40);
        }

        if (val > frameMaxVal && freq > 40) {
            frameMaxVal = val;
            frameMaxFreq = freq;
        }
    }

    // High-Res Peak Detection (Inspiración RTA HD)
    let absoluteMaxVal = -1;
    let absoluteMaxIdx = -1;
    for (let i = 0; i < dataArray.current.length; i++) {
        if (dataArray.current[i] > absoluteMaxVal) {
            absoluteMaxVal = dataArray.current[i];
            absoluteMaxIdx = i;
        }
    }

    if (absoluteMaxVal > 60) {
        const highResFreq = (absoluteMaxIdx * sampleRate) / analyser.current.fftSize;
        if (highResFreq > 50) { // Smart filter: Ignorar ruido mecánico
            frameCounterRef.current++;
            if (frameCounterRef.current % 15 === 0) { // Estabilización (4 updates/seg)
                setPeakFreq(Math.round(highResFreq));
            }
            frameMaxFreq = highResFreq; // Para luz de armónicos
        }
    }

    // 5. Análisis de Armónicos (Harmonic Light)
    if (absoluteMaxVal > 100 && frameMaxFreq > 50) {
        // Dibujar líneas de armónicos (2f, 3f, 4f)
        ctx.lineWidth = 0.5;
        for (let h = 2; h <= 4; h++) {
            const hFreq = frameMaxFreq * h;
            const hX = (hFreq / (sampleRate / 2)) * width;
            if (hX < width) {
                ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 / h})`;
                ctx.setLineDash([4, 4]);
                ctx.beginPath(); ctx.moveTo(hX, 0); ctx.lineTo(hX, height - 40); ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    // X-Axis Logarithmic Labels
    ctx.font = '800 8px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    [20, 100, 1000, 5000, 20000].forEach(f => {
        const x = (Math.log10(f/20) / Math.log10(20000/20)) * width;
        ctx.fillText(f >= 1000 ? `${f/1000}k` : f, x, height - 12);
    });

    // --- INTERACTIVE HUD ---
    if (hoverRef.current.active) {
        const hX = hoverRef.current.x;
        const hFreq = Math.round((hX / width) * (sampleRate / 2));
        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(hX, 0); ctx.lineTo(hX, height - 30); ctx.stroke();
        
        const hVal = dataArray.current[Math.floor((hX / width) * 128)];
        ctx.shadowBlur = 12; ctx.shadowColor = '#39FF14';
        ctx.beginPath(); ctx.arc(hX, height - (Math.pow(hVal/255, 1.4)*(height-80)) - 40, 4, 0, Math.PI*2);
        ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.shadowBlur = 0;

        // Tooltip
        ctx.fillStyle = 'rgba(3, 3, 3, 0.95)';
        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 1.5;
        const toolText = `${hFreq}Hz | -${(100 - (hVal/2.5)).toFixed(1)}dB`;
        ctx.font = '900 14px "JetBrains Mono"';
        const metrics = ctx.measureText(toolText);
        ctx.beginPath();
        ctx.roundRect(hX + 15, 40, metrics.width + 20, 34, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#39FF14';
        ctx.fillText(toolText, hX + 25, 62);
    }

    ctx.restore();

    // 1. Waterfall Render (Topografía Sónica 3D)
    const wWidth = wCanvas.width;
    const wHeight = wCanvas.height;
    wCtx.drawImage(wCanvas, 0, 0, wWidth, wHeight - 1, 0, 1, wWidth, wHeight - 1);
    const row = wCtx.createImageData(wWidth, 1);
    for (let i = 0; i < wWidth; i++) {
        const val = dataArray.current[Math.floor((i / wWidth) * 128)];
        const idx = i * 4;
        // Color Topografía: Del azul/púrpura al verde neón intenso
        row.data[idx] = val * 0.1; 
        row.data[idx+1] = val;     
        row.data[idx+2] = 255 - val; 
        row.data[idx+3] = 255;
    }
    wCtx.putImageData(row, 0, 0);

    animationRef.current = requestAnimationFrame(draw);
  }, [isFrozen]);

  const startEngine = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
      });
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx.current = new AudioContext();
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 4096; 
      analyser.current.smoothingTimeConstant = 0.4;

      // Filtro High-Pass Físico (Discriminación de Ruido Mecánico)
      const highPass = audioCtx.current.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 35; // Corte por debajo del ruido estructural
      highPass.Q.value = 0.7;

      const source = audioCtx.current.createMediaStreamSource(stream);
      source.connect(highPass);
      highPass.connect(analyser.current);

      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
      peakArray.current = new Float32Array(128).fill(0);
      
      resize();
      setIsRunning(true);
      draw();
    } catch (e) {
      alert("Acceso denegado al hardware.");
    }
  };

  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
      if (audioCtx.current) audioCtx.current.close();
    };
  }, [resize]);

  return (
    <div className="fixed inset-0 bg-[#010101] z-[100] p-3 md:p-6 flex flex-col font-sans text-white overscroll-none overflow-hidden">
      {/* Background Grid Global */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <header className="flex justify-between items-center mb-6 z-20 relative px-2">
        <button onClick={onBack} className="w-12 h-12 bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-xl active:scale-90 flex items-center justify-center hover:bg-white/5 transition-all shadow-2xl">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        
        <div className="text-center bg-white/[0.02] border border-white/10 backdrop-blur-md px-10 py-3 rounded-3xl shadow-2xl">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#39FF14] flex items-center gap-3" style={{ textShadow: '0 0 10px rgba(57,255,20,0.5)' }}>
                <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]"></div>
                VOSTOK SPECTRUM
            </h2>
            <div className="text-[7px] font-bold text-slate-500 tracking-widest uppercase mt-1">Noir-Tech Laboratory Unit | HD-RTA</div>
        </div>

        <button onClick={() => setIsFrozen(!isFrozen)} className="w-12 h-12 bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-xl active:scale-90 flex items-center justify-center hover:bg-white/5 transition-all shadow-2xl">
            {isFrozen ? <Play className="w-5 h-5 text-[#39FF14]" /> : <Pause className="w-5 h-5 text-white" />}
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-5 min-h-0 relative z-10">
        {/* Main Spectrum CRT Panel */}
        <div className="flex-[3] relative bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-2xl group">
            {/* Scanlines CRT Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 opacity-30" 
                 style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%)', backgroundSize: '100% 4px' }} />
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#39FF14] blur-[100px] opacity-[0.03] pointer-events-none" />

            <canvas 
                ref={canvasRef} 
                onMouseMove={(e) => { 
                    const rect = canvasRef.current.getBoundingClientRect();
                    hoverRef.current = { active: true, x: e.clientX - rect.left }; 
                }}
                onMouseLeave={() => { hoverRef.current = { active: false, x: 0 }; }}
                className="w-full h-full cursor-none" 
            />

            {/* PEAK HUD */}
            <div className="absolute top-6 left-8 flex gap-4 pointer-events-none z-30">
                <div className="bg-black/60 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-2xl shadow-xl">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-1">PEAK FREQ</span>
                    <div className="font-mono text-3xl font-black text-white">{peakFreq}<span className="text-xs ml-1 text-[#39FF14]">Hz</span></div>
                </div>
            </div>

            {/* STANDBY OVERLAY */}
            {!isRunning && (
                <div onClick={startEngine} className="absolute inset-0 bg-black/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-700">
                    <div className="relative mb-10">
                        <div className="absolute inset-0 bg-[#39FF14]/10 blur-[60px] rounded-full animate-pulse"></div>
                        <Mic className="w-16 h-16 text-[#39FF14] relative z-10 opacity-70" />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.6em] text-[#39FF14] uppercase animate-pulse">INICIAR MOTOR DSP</span>
                </div>
            )}
        </div>

        {/* Waterfall CRT Panel */}
        <div className="h-40 relative bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-[1.5rem] overflow-hidden shadow-2xl">
            <div className="absolute inset-0 pointer-events-none z-20 opacity-20" 
                 style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%)', backgroundSize: '100% 4px' }} />
            <canvas ref={waterfallCanvasRef} className="w-full h-full" />
            <div className="absolute top-3 left-6 z-30 flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_cyan]"></div>
                <span className="text-[8px] font-black text-white uppercase tracking-[0.3em] opacity-60">TOPOGRAFÍA SÓNICA</span>
            </div>
        </div>
      </main>
    </div>
  );
}
