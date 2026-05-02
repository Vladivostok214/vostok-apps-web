import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';

export default function SpectrumAnalyzer({ onBack }) {
  const canvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    startAnalysis();
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioCtx.current) audioCtx.current.close();
    };
  }, []);

  const startAnalysis = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    analyser.current = audioCtx.current.createAnalyser();
    analyser.current.fftSize = 1024;
    const source = audioCtx.current.createMediaStreamSource(stream);
    source.connect(analyser.current);
    draw();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.current.getByteFrequencyData(dataArray);

    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    for (let i = 0; i < bufferLength; i++) {
      // Sensibilidad aumentada: usamos una escala logarítmica para los bajos
      const barHeight = Math.pow(dataArray[i] / 255, 1.5) * canvas.height + 2;
      ctx.fillStyle = `hsla(${200 + i / 2}, 100%, 60%, 0.8)`;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
    }
    
    if (!isFrozen) {
        animationRef.current = requestAnimationFrame(draw);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] p-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="flex justify-between items-center mb-12">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#39FF14]">Spectrum</h2>
        <button onClick={() => setIsFrozen(!isFrozen)} className="p-3 bg-white/5 rounded-2xl border border-white/10">
          {isFrozen ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </header>
      <canvas ref={canvasRef} width="800" height="400" className="w-full h-2/3 border border-white/10 rounded-3xl bg-black" />
    </div>
  );
}