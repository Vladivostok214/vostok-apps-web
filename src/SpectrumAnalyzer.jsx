import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pause, Play, Mic } from 'lucide-react';

export default function SpectrumAnalyzer({ onBack }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  
  // Referencias persistentes para blindaje contra el Garbage Collector
  const canvasRef = useRef(null);
  const waterfallCanvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  
  // Buffers y datos de interacción
  const dataArrayRef = useRef(null);
  const peakArrayRef = useRef(null);
  const hoverRef = useRef({ active: false, x: 0 });

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !waterfallCanvasRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    const wCanvas = waterfallCanvasRef.current;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset y escalado limpio

    const wRect = wCanvas.parentElement.getBoundingClientRect();
    wCanvas.width = wRect.width * dpr;
    wCanvas.height = wRect.height * dpr;
    wCanvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);

    if (isRunning) {
      peakArrayRef.current = new Float32Array(Math.floor(rect.width)).fill(0);
    }
  }, [isRunning]);

  const draw = useCallback(() => {
    const loop = () => {
      if (!isRunning || isFrozen || !canvasRef.current || !analyser.current) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });
      const wCanvas = waterfallCanvasRef.current;
      const wCtx = wCanvas.getContext('2d', { alpha: false });

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Sincronización de datos forzada
      analyser.current.getByteFrequencyData(dataArrayRef.current);
      const dataArray = dataArrayRef.current;

      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, width, height);
      
      const sampleRate = audioCtx.current.sampleRate;
      const minFreq = 20;
      const maxFreq = sampleRate / 2;

      for (let x = 0; x < width; x++) {
        const freq = minFreq * Math.pow(maxFreq / minFreq, x / width);
        const bin = Math.floor((freq * analyser.current.fftSize) / sampleRate);
        const valRaw = dataArray[bin] || 0;
        
        const tilt = Math.max(0, 1 - Math.log10(freq / 20) / Math.log10(20000 / 20));
        const val = valRaw * (1 - tilt * 0.25);
        const barHeight = Math.pow(val / 255, 1.4) * (height - 60);
        
        ctx.fillStyle = `hsla(${240 - (x/width)*240}, 100%, 60%, ${val < 5 ? 0.1 : 0.8})`;
        ctx.fillRect(x, height - barHeight - 32, 1, barHeight);

        if (peakArrayRef.current) {
          if (val > peakArrayRef.current[x]) peakArrayRef.current[x] = val;
          else peakArrayRef.current[x] -= 1.2;
          const pHT = Math.pow(peakArrayRef.current[x] / 255, 1.4) * (height - 60);
          if (pHT > 2) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(x, height - pHT - 34, 1, 1);
          }
        }
      }

      wCtx.drawImage(wCanvas, 0, 0, wCanvas.width, wCanvas.height - 1, 0, 1, wCanvas.width, wCanvas.height - 1);
      
      if (hoverRef.current.active) {
        const hFreq = minFreq * Math.pow(maxFreq / minFreq, hoverRef.current.x / width);
        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hoverRef.current.x, 0); ctx.lineTo(hoverRef.current.x, height - 32); ctx.stroke();
        ctx.font = 'bold 12px "JetBrains Mono"';
        ctx.fillStyle = '#39FF14';
        ctx.fillText(`${Math.round(hFreq)}Hz`, hoverRef.current.x + 8, 20);
      }

      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [isRunning, isFrozen]);

  // --- BOTÓN DE 2 TAREAS: ROTACIÓN + AUDIO ---
  const startEngine = async () => {
    try {
      // 1. Forzar Rotación (UX Táctica)
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }

      // 2. Inicializar Audio con Conexión Forzada (Evita silencio en mobile)[cite: 4]
      if (audioCtx.current) await audioCtx.current.close();
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx.current = new AudioContext();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      streamRef.current = stream;

      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 2048;

      // Re-inclusión de Filtros de Blindaje[cite: 5]
      const highpass = audioCtx.current.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 20;

      // Conexión física al destino con ganancia cero para mantener el flujo vivo[cite: 4]
      const silentGain = audioCtx.current.createGain();
      silentGain.gain.value = 0;

      sourceRef.current = audioCtx.current.createMediaStreamSource(stream);
      sourceRef.current.connect(highpass);
      highpass.connect(analyser.current);
      analyser.current.connect(silentGain);
      silentGain.connect(audioCtx.current.destination);
      
      dataArrayRef.current = new Uint8Array(analyser.current.frequencyBinCount);
      
      if (audioCtx.current.state === 'suspended') {
        await audioCtx.current.resume();
      }

      setIsRunning(true);
      setTimeout(resizeCanvas, 300);
    } catch (e) {
      alert("Error: Revisa los permisos de micrófono y rotación.");
    }
  };

  const handleBack = () => {
    if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
    }
    onBack();
  };

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    if (isRunning) draw();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtx.current) audioCtx.current.close();
    };
  }, [isRunning, draw, resizeCanvas]);

  return (
    <div className="fixed inset-0 bg-[#030303] z-[100] p-3 md:p-6 flex flex-col overflow-hidden text-white font-sans">
      <header className="flex justify-between items-center mb-4">
        <button onClick={handleBack} className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5 opacity-50" />
        </button>
        <h2 className="text-[10px] font-black tracking-[0.4em] text-[#39FF14]">VOSTOK SPECTRUM</h2>
        <button onClick={() => setIsFrozen(!isFrozen)} className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center border border-[#39FF14]/20">
          {isFrozen ? <Play className="w-5 h-5 text-[#39FF14]" /> : <Pause className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex-[3] relative glass-panel rounded-3xl overflow-hidden border border-white/5 bg-[#010101]">
          <canvas 
            ref={canvasRef} 
            onMouseMove={(e) => { hoverRef.current = { active: true, x: e.nativeEvent.offsetX }; }}
            onMouseLeave={() => { hoverRef.current = { active: false, x: 0 }; }}
            onTouchMove={(e) => {
                const rect = e.target.getBoundingClientRect();
                hoverRef.current = { active: true, x: e.touches[0].clientX - rect.left };
            }}
            onTouchEnd={() => { hoverRef.current = { active: false, x: 0 }; }}
            className="w-full h-full cursor-none" 
          />
          {!isRunning && (
            <div onClick={startEngine} className="absolute inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center cursor-pointer group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#39FF14] blur-[40px] opacity-10 group-hover:opacity-30 rounded-full transition-all duration-700 animate-pulse"></div>
                <div className="w-16 h-16 rounded-full border border-[#39FF14]/20 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                    <Mic className="w-7 h-7 text-[#39FF14]" />
                </div>
              </div>
              <span className="text-[10px] font-black tracking-[0.6em] text-[#39FF14]">INICIAR</span>
            </div>
          )}
        </div>
        <div className="flex-1 relative glass-panel rounded-2xl overflow-hidden border border-white/5 bg-[#010101]">
          <canvas ref={waterfallCanvasRef} className="w-full h-full" />
          <div className="absolute top-2 left-4 text-[7px] font-black text-cyan-400 uppercase tracking-widest opacity-40">Espectrograma</div>
        </div>
      </main>
    </div>
  );
}