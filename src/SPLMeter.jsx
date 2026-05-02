import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';

export default function SPLMeter({ onBack }) {
  const [db, setDb] = useState(0);
  const audioContext = useRef(null);

  useEffect(() => {
    let stream, analyser, dataArray;
    const initAudio = async () => {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        setDb(Math.round(20 * Math.log10(average + 1)));
        requestAnimationFrame(update);
      };
      update();
    };
    initAudio();
    return () => { if (audioContext.current) audioContext.current.close(); };
  }, []);

  const getStatus = (val) => {
    if (val < 60) return { color: '#39FF14', msg: 'Seguro' };
    if (val < 85) return { color: '#fbbf24', msg: 'Precaución' };
    return { color: '#ef4444', msg: 'Daño potencial en 1 hora' };
  };

  const status = getStatus(db);

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] p-8 pt-[max(2rem,env(safe-area-inset-top))] flex flex-col">
      <header className="flex justify-between items-center mb-12">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#39FF14]">SPL Meter</h2>
        <div className="w-11" />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-9xl font-black mb-8" style={{ color: status.color }}>{db}<span className="text-2xl">dB</span></div>
        <div className="px-8 py-3 rounded-full border" style={{ borderColor: status.color, color: status.color }}>{status.msg}</div>
      </div>
    </div>
  );
}