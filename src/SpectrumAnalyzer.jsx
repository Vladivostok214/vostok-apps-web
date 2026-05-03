import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pause, Play, Maximize2, Minimize2, Mic } from 'lucide-react';

export default function SpectrumAnalyzer({ onBack }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const canvasRef = useRef(null);
  const waterfallCanvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const animationRef = useRef(null);
  
  const dataArrayRef = useRef(null);
  const peakArrayRef = useRef(null);
  const [hoverData, setHoverData] = useState({ active: false, x: 0 });

  // --- REDIMENSIONAMIENTO TÁCTICO PARA MÓVILES ---
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !waterfallCanvasRef.current) return;
    
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    const wCanvas = waterfallCanvasRef.current;

    // Ajuste de RTA (Analizador Principal)
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.getContext('2d').scale(dpr, dpr);

    // Ajuste de Espectrograma (Waterfall)
    const wRect = wCanvas.parentElement.getBoundingClientRect();
    wCanvas.width = wRect.width * dpr;
    wCanvas.height = wRect.height * dpr;
    wCanvas.getContext('2d').scale(dpr, dpr);

    if (isRunning) {
      const logicalWidth = Math.floor(rect.width);
      peakArrayRef.current = new Float32Array(logicalWidth).fill(0);
    }
  }, [isRunning]);

  // --- BUCLE DE PROCESAMIENTO DSP ---
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

      analyser.current.getByteFrequencyData(dataArrayRef.current);
      const dataArray = dataArrayRef.current;

      // Limpieza de frame con estética Noir
      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, width, height);
      
      const minFreq = 20;
      const maxFreq = audioCtx.current.sampleRate / 2;

      // Dibujado del Espectro Logarítmico
      for (let x = 0; x < width; x++) {
        const freq = minFreq * Math.pow(maxFreq / minFreq, x / width);
        const bin = (freq * analyser.current.fftSize) / audioCtx.current.sampleRate;
        const valRaw = dataArray[Math.floor(bin)] || 0;
        
        const tilt = Math.max(0, 1 - Math.log10(freq / 20) / Math.log10(20000 / 20));
        const val = valRaw * (1 - tilt * 0.2);
        const barHeight = Math.pow(val / 255, 1.4) * (height - 60);
        
        ctx.fillStyle = `hsla(${240 - (x/width)*240}, 100%, 60%, ${val < 10 ? 0.2 : 0.8})`;
        ctx.fillRect(x, height - barHeight - 32, 1, barHeight);

        if (val > (peakArrayRef.current?.[x] || 0)) peakArrayRef.current[x] = val;
        else if (peakArrayRef.current) peakArrayRef.current[x] -= 1.5;
      }

      // Desplazamiento del Espectrograma
      wCtx.drawImage(wCanvas, 0, 0, wCanvas.width, wCanvas.height - 1, 0, 1, wCanvas.width, wCanvas.height - 1);
      
      // Crosshair Interactivo de Alta Legibilidad
      if (hoverData.active) {
        const hFreq = minFreq * Math.pow(maxFreq / minFreq, hoverData.x / width);
        const hBin = (hFreq * analyser.current.fftSize) / audioCtx.current.sampleRate;
        const hVal = dataArray[Math.floor(hBin)] || 0;
        const hDb = -100 + (hVal / 255) * 100;

        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hoverData.x, 0); ctx.lineTo(hoverData.x, height - 32); ctx.stroke();
        
        const tooltip = `${Math.round(hFreq)}Hz | ${hDb.toFixed(1)}dB`;
        ctx.font = '900 14px "JetBrains Mono"';
        const tWidth = ctx.measureText(tooltip).width;
        
        ctx.fillStyle = 'rgba(3,3,3,0.9)';
        ctx.fillRect(hoverData.x + 15 + tWidth > width ? hoverData.x - tWidth - 25 : hoverData.x + 15, 20, tWidth + 20, 30);
        ctx.fillStyle = '#39FF14';
        ctx.fillText(tooltip, hoverData.x + 15 + tWidth > width ? hoverData.x - tWidth - 15 : hoverData.x + 25, 40);
      }

      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [isRunning, isFrozen, hoverData]);

  // --- INICIALIZACIÓN DEL MOTOR (FIX PARA MÓVILES) ---
  const startEngine = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx.current = new AudioContext();
      
      // Despertar el contexto si el navegador lo bloqueó (Políticas de ahorro de energía)
      if (audioCtx.current.state === 'suspended') {
        await audioCtx.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 2048; // Balance óptimo resolución/rendimiento
      
      const source = audioCtx.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      
      dataArrayRef.current = new Uint8Array(analyser.current.frequencyBinCount);
      setIsRunning(true);
      
      // Forzar el renderizado una vez se tiene el permiso
      setTimeout(resizeCanvas, 200);
    } catch (e) { 
      alert("Error de acceso: Por favor, permite el uso del micrófono.");
      console.error(e); 
    }
  };

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    if (isRunning) draw();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
      if (audioCtx.current) audioCtx.current.close();
    };
  }, [isRunning, draw, resizeCanvas]);

  return (
    <div className="fixed inset-0 bg-[#030303] z-[100] p-3 md:p-6 flex flex-col overflow-hidden text-white">
      {/* Bloqueo de Orientación Móvil */}
      <div className="hidden portrait:flex fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex-col items-center justify-center p-8 text-center">
        <Mic className="w-16 h-16 text-[#39FF14] mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-[#39FF14] tracking-widest uppercase mb-2">Vostok Spectrum</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Gira tu dispositivo para iniciar el análisis</p>
      </div>

      <header className="flex justify-between items-center mb-4">
        {/* Botón de Volver al Ecosistema */}
        <button onClick={onBack} className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5 opacity-50" />
        </button>

        <div className="text-center">
          <h2 className="text-[10px] font-black tracking-[0.4em] text-[#39FF14]">VOSTOK SPECTRUM</h2>
        </div>

        <button onClick={() => setIsFrozen(!isFrozen)} className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center border border-[#39FF14]/20">
          {isFrozen ? <Play className="w-5 h-5 text-[#39FF14]" /> : <Pause className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex-[3] relative glass-panel rounded-3xl overflow-hidden border border-white/5 bg-black">
          <canvas 
            ref={canvasRef} 
            onMouseMove={(e) => {
              const rect = e.target.getBoundingClientRect();
              setHoverData({ active: true, x: e.clientX - rect.left });
            }}
            onMouseLeave={() => setHoverData({ active: false, x: 0 })}
            onTouchMove={(e) => {
              const rect = e.target.getBoundingClientRect();
              setHoverData({ active: true, x: e.touches[0].clientX - rect.left });
            }}
            onTouchEnd={() => setHoverData({ active: false, x: 0 })}
            className="w-full h-full" 
          />
          
          {/* Modo de Espera Minimalista */}
          {!isRunning && (
            <div onClick={startEngine} className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center cursor-pointer group">
              <div className="w-20 h-20 rounded-full border border-[#39FF14]/30 flex items-center justify-center mb-4 group-hover:border-[#39FF14] transition-all">
                <Mic className="w-8 h-8 text-[#39FF14] animate-pulse" />
              </div>
              <span className="text-[10px] font-black tracking-[0.6em] text-[#39FF14] opacity-70 group-hover:opacity-100">INICIAR</span>
            </div>
          )}
        </div>

        <div className="flex-1 relative glass-panel rounded-2xl overflow-hidden border border-white/5 bg-black">
          <canvas ref={waterfallCanvasRef} className="w-full h-full" />
          <div className="absolute top-2 left-4 text-[7px] font-black text-cyan-400 uppercase tracking-widest opacity-50">Espectrograma</div>
        </div>
      </main>
    </div>
  );
}