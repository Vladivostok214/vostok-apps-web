import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pause, Play, Mic, RotateCw } from 'lucide-react';

export default function SpectrumAnalyzer({ onBack }) {
  const [prepStep, setPrepStep] = useState(0); // 0: Standby, 1: Ready, 2: Engine Running
  const [isFrozen, setIsFrozen] = useState(false);
  
  // Referencias persistentes (Evitan que el recolector de basura corte la señal)
  const canvasRef = useRef(null);
  const waterfallCanvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  
  // Buffers de alto rendimiento
  const dataArrayRef = useRef(null);
  const peakArrayRef = useRef(null);
  const hoverRef = useRef({ active: false, x: 0 });

  // --- SINCRONIZACIÓN DE LIENZO ---
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !waterfallCanvasRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    const wCanvas = waterfallCanvasRef.current;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);

    const wRect = wCanvas.parentElement.getBoundingClientRect();
    wCanvas.width = wRect.width * dpr;
    wCanvas.height = wRect.height * dpr;
    wCanvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);

    if (prepStep === 2) {
      peakArrayRef.current = new Float32Array(Math.floor(rect.width)).fill(0);
    }
  }, [prepStep]);

  // --- BUCLE DE RENDERIZADO DSP ---
  const draw = useCallback(() => {
    const loop = () => {
      if (prepStep !== 2 || isFrozen || !canvasRef.current || !analyser.current) {
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

      // EXTRACCIÓN DE DATOS REAL-TIME[cite: 3]
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
        
        // Compensación de curva de respuesta humana (Pink Tilt)[cite: 3]
        const tilt = Math.max(0, 1 - Math.log10(freq / 20) / Math.log10(20000 / 20));
        const val = valRaw * (1 - tilt * 0.25);
        const barHeight = Math.pow(val / 255, 1.4) * (height - 60);
        
        ctx.fillStyle = `hsla(${240 - (x/width)*240}, 100%, 60%, ${val < 5 ? 0.1 : 0.8})`;
        ctx.fillRect(x, height - barHeight - 32, 1, barHeight);

        // Peak Hold dinámico
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

      // Desplazamiento del Espectrograma
      wCtx.drawImage(wCanvas, 0, 0, wCanvas.width, wCanvas.height - 1, 0, 1, wCanvas.width, wCanvas.height - 1);
      
      // HUD de Precisión
      if (hoverRef.current.active) {
        const hFreq = minFreq * Math.pow(maxFreq / minFreq, hoverRef.current.x / width);
        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hoverRef.current.x, 0); ctx.lineTo(hoverRef.current.x, height - 32); ctx.stroke();
        ctx.font = '900 14px "JetBrains Mono"';
        ctx.fillStyle = '#39FF14';
        ctx.fillText(`${Math.round(hFreq)}Hz`, hoverRef.current.x + 10, 30);
      }

      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [prepStep, isFrozen]);

  // PASO 1: ORIENTACIÓN[cite: 3]
  const handleRotate = async () => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }
      setPrepStep(1);
      setTimeout(resizeCanvas, 300);
    } catch (e) { setPrepStep(1); }
  };

  // PASO 2: IGNICIÓN DEL MOTOR (Conexión forzada)[cite: 4, 5]
  const startEngine = async () => {
    try {
      if (audioCtx.current) await audioCtx.current.close();
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx.current = new AudioContext();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      streamRef.current = stream;

      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 4096; // Mayor resolución espectral

      // BLINDAJE: Conexión física silenciosa para mantener el reloj activo
      const silentGain = audioCtx.current.createGain();
      silentGain.gain.value = 0;

      sourceRef.current = audioCtx.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyser.current);
      analyser.current.connect(silentGain);
      silentGain.connect(audioCtx.current.destination);
      
      dataArrayRef.current = new Uint8Array(analyser.current.frequencyBinCount);
      
      if (audioCtx.current.state === 'suspended') {
        await audioCtx.current.resume();
      }

      setPrepStep(2);
      setTimeout(resizeCanvas, 200);
    } catch (e) { alert("Acceso denegado al hardware."); }
  };

  const handleBack = () => {
    if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    onBack();
  };

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    if (prepStep === 2) draw();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtx.current) audioCtx.current.close();
    };
  }, [prepStep, draw, resizeCanvas]);

  return (
    <div className="fixed inset-0 bg-[#030303] z-[100] p-3 md:p-6 flex flex-col overflow-hidden text-white font-sans">
      <header className="flex justify-between items-center mb-4">
        <button onClick={handleBack} className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition-all"><ArrowLeft className="w-5 h-5 opacity-50" /></button>
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
          
          {prepStep === 0 && (
            <div onClick={handleRotate} className="absolute inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center cursor-pointer group">
              <div className="w-16 h-16 rounded-full border border-[#39FF14]/20 flex items-center justify-center mb-4"><RotateCw className="w-6 h-6 text-[#39FF14]" /></div>
              <span className="text-[9px] font-black tracking-[0.5em] text-[#39FF14]">OPTIMIZAR VISTA</span>
            </div>
          )}

          {prepStep === 1 && (
            <div onClick={startEngine} className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center cursor-pointer group">
              <div className="w-16 h-16 rounded-full border border-[#39FF14]/40 flex items-center justify-center mb-4"><Mic className="w-6 h-6 text-[#39FF14] animate-pulse" /></div>
              <span className="text-[9px] font-black tracking-[0.5em] text-[#39FF14]">INICIAR MOTOR DSP</span>
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