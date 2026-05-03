import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pause, Play, Maximize2, Minimize2, Mic } from 'lucide-react';

export default function SpectrumAnalyzer({ onBack }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [hoverData, setHoverData] = useState({ active: false, x: 0 });
  
  const canvasRef = useRef(null);
  const waterfallCanvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  
  const dataArrayRef = useRef(null);
  const peakArrayRef = useRef(null);

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !waterfallCanvasRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasRef.current.parentElement.getBoundingClientRect();
    const wRect = waterfallCanvasRef.current.parentElement.getBoundingClientRect();

    canvasRef.current.width = rect.width * dpr;
    canvasRef.current.height = rect.height * dpr;
    canvasRef.current.getContext('2d').scale(dpr, dpr);

    waterfallCanvasRef.current.width = wRect.width * dpr;
    waterfallCanvasRef.current.height = wRect.height * dpr;
    waterfallCanvasRef.current.getContext('2d').scale(dpr, dpr);

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

      // ACTUALIZACIÓN CRÍTICA: Forzar lectura de datos
      if (dataArrayRef.current) {
        analyser.current.getByteFrequencyData(dataArrayRef.current);
      }
      
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
        const val = valRaw * (1 - tilt * 0.2);
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
      
      if (hoverData.active) {
        const hFreq = minFreq * Math.pow(maxFreq / minFreq, hoverData.x / width);
        ctx.strokeStyle = '#39FF14';
        ctx.beginPath();
        ctx.moveTo(hoverData.x, 0); ctx.lineTo(hoverData.x, height - 32); ctx.stroke();
        ctx.font = 'bold 12px "JetBrains Mono"';
        ctx.fillStyle = '#39FF14';
        ctx.fillText(`${Math.round(hFreq)}Hz`, hoverData.x + 8, 20);
      }

      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [isRunning, isFrozen, hoverData]);

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
      analyser.current.fftSize = 2048;
      
      sourceRef.current = audioCtx.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyser.current);
      
      dataArrayRef.current = new Uint8Array(analyser.current.frequencyBinCount);
      
      if (audioCtx.current.state === 'suspended') {
        await audioCtx.current.resume();
      }

      setIsRunning(true);
      setTimeout(resizeCanvas, 100);
    } catch (e) {
      alert("Error de conexión: Por favor, recarga y permite el micrófono.");
    }
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
        <button onClick={onBack} className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center border border-white/10 active:scale-90"><ArrowLeft className="w-5 h-5 opacity-50" /></button>
        <h2 className="text-[10px] font-black tracking-[0.4em] text-[#39FF14]">VOSTOK SPECTRUM</h2>
        <button onClick={() => setIsFrozen(!isFrozen)} className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center border border-[#39FF14]/20">
          {isFrozen ? <Play className="w-5 h-5 text-[#39FF14]" /> : <Pause className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex-[3] relative glass-panel rounded-3xl overflow-hidden border border-white/5 bg-[#010101]">
          <canvas 
            ref={canvasRef} 
            onMouseMove={(e) => setHoverData({ active: true, x: e.nativeEvent.offsetX })}
            onMouseLeave={() => setHoverData({ active: false, x: 0 })}
            onTouchMove={(e) => {
                const rect = e.target.getBoundingClientRect();
                setHoverData({ active: true, x: e.touches[0].clientX - rect.left });
            }}
            className="w-full h-full cursor-none" 
          />
          {!isRunning && (
            <div onClick={startEngine} className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center cursor-pointer">
              <div className="w-16 h-16 rounded-full border border-[#39FF14]/20 flex items-center justify-center mb-4"><Mic className="w-6 h-6 text-[#39FF14] animate-pulse" /></div>
              <span className="text-[9px] font-black tracking-[0.5em] text-[#39FF14]">INICIAR MOTOR</span>
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