import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pause, Play } from 'lucide-react';

export default function SpectrumAnalyzer({ onBack }) {
  const canvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const animationRef = useRef(null);
  const peakRef = useRef(null);
  const waterfallCanvasRef = useRef(null);

  const draw = useCallback(() => {
    function loop() {
      if (!canvasRef.current || !analyser.current || isFrozen) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });
      const bufferLength = analyser.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.current.getByteFrequencyData(dataArray);

      if (!peakRef.current) peakRef.current = new Float32Array(bufferLength);

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const sampleRate = audioCtx.current.sampleRate;
      const minFreq = 20;
      const maxFreq = sampleRate / 2;

      // Draw Cyber Grid
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.05)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= canvas.width; x += canvas.width / 12) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += canvas.height / 8) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      for (let i = 0; i < canvas.width; i++) {
        const freq = minFreq * Math.pow(maxFreq / minFreq, i / canvas.width);
        const bin = (freq * analyser.current.fftSize) / sampleRate;

        const b0 = Math.floor(bin);
        const b1 = Math.min(b0 + 1, bufferLength - 1);
        const frac = bin - b0;
        const val = dataArray[b0] * (1 - frac) + dataArray[b1] * frac;

        const barHeight = Math.pow(val / 255, 1.4) * (canvas.height - 80);

        // Vostok Cyber Gradient (Cyan to Lime)
        const hue = 180 + (i / canvas.width) * 60;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
        ctx.fillRect(i, canvas.height - barHeight - 40, 1, barHeight);

        if (val > peakRef.current[i]) peakRef.current[i] = val;
        else peakRef.current[i] -= 0.6;

        const peakHeight = Math.pow(peakRef.current[i] / 255, 1.4) * (canvas.height - 80);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(i, canvas.height - peakHeight - 42, 1, 1.5);
      }

      if (waterfallCanvasRef.current) {
        const wCanvas = waterfallCanvasRef.current;
        const wCtx = wCanvas.getContext('2d');
        const imageData = wCtx.getImageData(0, 0, wCanvas.width, wCanvas.height);

        wCtx.putImageData(imageData, 0, 1);

        for (let i = 0; i < wCanvas.width; i++) {
          const freq = minFreq * Math.pow(maxFreq / minFreq, i / wCanvas.width);
          const bin = (freq * analyser.current.fftSize) / sampleRate;
          const val = dataArray[Math.floor(bin)];

          // Waterfall color mapping: Deep Purple to Bright Cyan
          const wHue = 260 - (val / 255) * 100;
          wCtx.fillStyle = `hsla(${wHue}, 100%, ${val / 4}%, 1)`;
          wCtx.fillRect(i, 0, 1, 1);
        }
      }


      animationRef.current = requestAnimationFrame(loop);
    }
    loop();
  }, [isFrozen]);
  const startAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 2048;
      analyser.current.smoothingTimeConstant = 0.8;
      const source = audioCtx.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      draw();
    } catch (e) {
      console.error(e);
    }
  }, [draw]);

  useEffect(() => {
    startAnalysis();
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioCtx.current) audioCtx.current.close();
    };
  }, [startAnalysis]);

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] p-6 pt-[max(2rem,env(safe-area-inset-top))] flex flex-col gap-4 overflow-hidden">
      <header className="flex justify-between items-center shrink-0">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all"><ArrowLeft className="w-5 h-5" /></button>
        <div className="text-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#39FF14] mb-1">Spectrum Analyzer</h2>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Logarithmic / 60 FPS / Waterfall</div>
        </div>
        <button onClick={() => setIsFrozen(!isFrozen)} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
          {isFrozen ? <Play className="w-5 h-5 text-[#39FF14]" /> : <Pause className="w-5 h-5 text-white" />}
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex-1 relative border border-white/10 rounded-[2rem] overflow-hidden bg-black shadow-2xl">
            <canvas ref={canvasRef} width="1000" height="400" className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-6 flex gap-12 text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] pointer-events-none">
                <span>20Hz</span>
                <span>200Hz</span>
                <span>2kHz</span>
                <span>20kHz</span>
            </div>
        </div>

        <div className="h-40 relative border border-white/10 rounded-[2rem] overflow-hidden bg-black shadow-xl shrink-0">
            <canvas ref={waterfallCanvasRef} width="1000" height="160" className="w-full h-full object-cover" />
            <div className="absolute top-4 left-6 text-[8px] font-black text-[#39FF14]/40 uppercase tracking-[0.3em]">Waterfall History</div>
        </div>
      </div>
    </div>
  );
}