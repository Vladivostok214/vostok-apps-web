import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pause, Play, Maximize2, Minimize2, Mic } from 'lucide-react';

export default function SpectrumAnalyzer({ onBack }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Referencias de Canvas y Contextos
  const canvasRef = useRef(null);
  const waterfallCanvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const animationRef = useRef(null);
  
  // Buffers Zero-Copy (Persistentes para evitar Garbage Collection)
  const dataArrayRef = useRef(null);
  const peakArrayRef = useRef(null);

  // Estado del Cursor (Hover)
  const [hoverData, setHoverData] = useState({ active: false, x: 0 });

  // --- SISTEMA DE REDIMENSIONAMIENTO ---
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !waterfallCanvasRef.current) return;
    
    const dpr = window.devicePixelRatio || 1;
    const canvases = [
      { el: canvasRef.current, parent: canvasRef.current.parentElement },
      { el: waterfallCanvasRef.current, parent: waterfallCanvasRef.current.parentElement }
    ];

    canvases.forEach(({ el, parent }) => {
      const rect = parent.getBoundingClientRect();
      el.width = rect.width * dpr;
      el.height = rect.height * dpr;
      const ctx = el.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset previo
      ctx.scale(dpr, dpr);
    });

    if (isRunning) {
      const width = Math.floor(canvasRef.current.width / dpr);
      if (!peakArrayRef.current || peakArrayRef.current.length !== width) {
        peakArrayRef.current = new Float32Array(width).fill(0);
      }
    }
  }, [isRunning]);

  // --- LÓGICA DE DIBUJO Y DSP ---
  const draw = useCallback(() => {
    function loop() {
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
      const wWidth = wCanvas.width;
      const wHeight = wCanvas.height;

      // 1. Obtener datos del Analizador
      analyser.current.getByteFrequencyData(dataArrayRef.current);
      const dataArray = dataArrayRef.current;

      // 2. Limpiar Fondo y Dibujar Rejilla (Grid)
      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const minFreq = 20;
      const maxFreq = audioCtx.current.sampleRate / 2;
      const gridFreqs = [20, 100, 500, 1000, 5000, 10000, 20000];

      gridFreqs.forEach(f => {
        const x = width * (Math.log(f / minFreq) / Math.log(maxFreq / minFreq));
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      });

      // 3. Waterfall Shift (Desplazamiento temporal)
      wCtx.drawImage(wCanvas, 0, 0, wWidth, wHeight - 1, 0, 1, wWidth, wHeight - 1);
      const newRow = wCtx.createImageData(wWidth, 1);
      const rowData = newRow.data;

      // 4. Renderizado Espectral
      for (let x = 0; x < width; x++) {
        const freq = minFreq * Math.pow(maxFreq / minFreq, x / width);
        const binExacto = (freq * analyser.current.fftSize) / audioCtx.current.sampleRate;
        const b0 = Math.floor(binExacto);
        const b1 = Math.min(b0 + 1, analyser.current.frequencyBinCount - 1);
        const frac = binExacto - b0;
        
        let valRaw = dataArray[b0] * (1 - frac) + dataArray[b1] * frac;
        const tilt = Math.max(0, 1 - Math.log10(freq / 20) / Math.log10(20000 / 20));
        let val = valRaw * (1 - tilt * 0.2);

        const barHeight = Math.pow(val / 255, 1.4) * (height - 60);
        const hue = 240 - ((x / width) * 240);
        
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${val < 10 ? 0.2 : 0.8})`;
        ctx.fillRect(x, height - barHeight - 32, 1, barHeight);

        // Peak Hold
        if (val > peakArrayRef.current[x]) peakArrayRef.current[x] = val;
        else peakArrayRef.current[x] -= 1.5;

        const peakHeight = Math.pow(peakArrayRef.current[x] / 255, 1.4) * (height - 60);
        if (peakHeight > 2) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillRect(x, height - peakHeight - 34, 1, 1.5);
        }

        // Waterfall Row
        const ratio = wWidth / width;
        const wx = Math.floor(x * ratio);
        const idx = wx * 4;
        if (valRaw > 5) {
          const wHue = (1 - (valRaw/255)) * 240;
          rowData[idx] = Math.min(255, valRaw);
          rowData[idx+1] = Math.max(0, 255 - valRaw);
          rowData[idx+2] = 255 - valRaw;
          rowData[idx+3] = 255;
        } else {
          rowData[idx] = 5; rowData[idx+1] = 5; rowData[idx+2] = 5; rowData[idx+3] = 255;
        }
      }
      wCtx.putImageData(newRow, 0, 0);

      // 5. Crosshair de Alta Legibilidad
      if (hoverData.active && hoverData.x >= 0 && hoverData.x <= width) {
        const hX = hoverData.x;
        const hFreq = minFreq * Math.pow(maxFreq / minFreq, hX / width);
        const hBin = (hFreq * analyser.current.fftSize) / audioCtx.current.sampleRate;
        const hVal = dataArray[Math.floor(hBin)];
        const hDb = -100 + (hVal / 255) * 100;

        ctx.strokeStyle = '#39FF14';
        ctx.beginPath();
        ctx.moveTo(hX, 0); ctx.lineTo(hX, height - 32); ctx.stroke();

        const label = `${hFreq >= 1000 ? (hFreq/1000).toFixed(2)+'k' : Math.round(hFreq)}Hz | ${hDb.toFixed(1)}dB`;
        ctx.font = '900 14px "JetBrains Mono"';
        const txtW = ctx.measureText(label).width;
        
        ctx.fillStyle = 'rgba(3,3,3,0.95)';
        ctx.fillRect(hX + 15 + txtW > width ? hX - txtW - 25 : hX + 15, 20, txtW + 20, 30);
        ctx.fillStyle = '#39FF14';
        ctx.fillText(label, hX + 15 + txtW > width ? hX - txtW - 15 : hX + 25, 40);
      }

      animationRef.current = requestAnimationFrame(loop);
    }
    loop();
  }, [isRunning, isFrozen, hoverData]);

  // --- CONTROL DE HARDWARE ---
  const startEngine = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 4096;
      analyser.current.smoothingTimeConstant = 0.5;
      
      const source = audioCtx.current.createMediaStreamSource(stream);
      const hp = audioCtx.current.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 20;
      
      source.connect(hp);
      hp.connect(analyser.current);
      
      dataArrayRef.current = new Uint8Array(analyser.current.frequencyBinCount);
      setIsRunning(true);
      setTimeout(resizeCanvas, 100);
    } catch (e) { console.error(e); }
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
      {/* Portait Warning */}
      <div className="hidden portrait:flex fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-8 animate-pulse">
           <Mic className="w-20 h-20 text-[#39FF14]/20" />
        </div>
        <h2 className="text-xl font-black text-[#39FF14] tracking-widest uppercase mb-2">Rotar Dispositivo</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">El análisis requiere orientación horizontal</p>
      </div>

      <header className="flex justify-between items-center mb-4 px-2">
        <div className="flex gap-3">
          <button onClick={onBack} className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center border border-white/10"><ArrowLeft className="w-5 h-5 opacity-50" /></button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-12 h-12 glass-panel rounded-2xl hidden md:flex items-center justify-center border border-white/10">
            {isFullscreen ? <Minimize2 className="w-5 h-5 opacity-50" /> : <Maximize2 className="w-5 h-5 opacity-50" />}
          </button>
        </div>
        
        <div className="text-center glass-panel px-6 py-2 rounded-2xl border border-white/10">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#39FF14]">Vostok Spectrum</h2>
          <div className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">DSP Engine / Zero-Copy</div>
        </div>

        <button onClick={() => setIsFrozen(!isFrozen)} className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center border border-[#39FF14]/20">
          {isFrozen ? <Play className="w-5 h-5 text-[#39FF14]" /> : <Pause className="w-5 h-5 text-white" />}
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex-[3] relative glass-panel rounded-[2rem] overflow-hidden group border border-white/5">
          <canvas 
            ref={canvasRef} 
            onMouseMove={(e) => setHoverData({ active: true, x: e.nativeEvent.offsetX })}
            onMouseLeave={() => setHoverData({ active: false, x: 0 })}
            onTouchMove={(e) => setHoverData({ active: true, x: e.touches[0].clientX - e.target.getBoundingClientRect().left })}
            className="w-full h-full cursor-crosshair" 
          />
          
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/40 flex items-center px-6 pointer-events-none">
             {[20, 100, 1000, 5000, 20000].map(f => (
               <span key={f} className="text-[8px] font-black text-slate-600 absolute" style={{ left: `${(Math.log(f/20)/Math.log(22050/20))*100}%` }}>
                 {f >= 1000 ? f/1000+'k' : f}
               </span>
             ))}
          </div>

          {!isRunning && (
            <div onClick={startEngine} className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer">
              <Mic className="w-12 h-12 text-[#39FF14] mb-6 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.6em] text-[#39FF14]">INICIAR</span>
            </div>
          )}
        </div>

        <div className="flex-1 relative glass-panel rounded-[1.5rem] overflow-hidden border border-white/5">
          <canvas ref={waterfallCanvasRef} className="w-full h-full" />
          <div className="absolute top-3 left-4 text-[8px] font-black text-cyan-400 uppercase tracking-widest">Espectrograma</div>
        </div>
      </main>
    </div>
  );
}