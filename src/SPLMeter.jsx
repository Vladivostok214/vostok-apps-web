import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';

export default function SPLMeter({ onBack }) {
  const [db, setDb] = useState(20); // Piso de 20dB
  const [cumulativeRisk, setCumulativeRisk] = useState(0); // Exposición acumulada simulada
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
        
        // Sensibilidad mejorada: mapeo logarítmico calibrado
        const instantDb = Math.max(20, Math.round(20 * Math.log10(average + 1) + 20));
        setDb(instantDb);
        
        // Riesgo acumulado: simple integral de tiempo sobre 85dB
        if (instantDb > 85) {
          setCumulativeRisk(prev => Math.min(100, prev + (instantDb - 85) * 0.05));
        }
        
        requestAnimationFrame(update);
      };
      update();
    };
    initAudio();
    return () => { if (audioContext.current) audioContext.current.close(); };
  }, []);

  const getStatus = (val) => {
    if (val < 60) return { color: '#39FF14', msg: 'Nivel Seguro: Ambiente normal' };
    if (val < 85) return { color: '#fbbf24', msg: 'Precaución: Exposición prolongada limitada' };
    return { color: '#ef4444', msg: 'Peligro: Riesgo auditivo detectado' };
  };

  const status = getStatus(db);

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] p-8 pt-[max(2rem,env(safe-area-inset-top))] flex flex-col">
      <header className="flex justify-between items-center mb-12">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#39FF14]">SPL Meter</h2>
        <div className="w-11" />
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-9xl font-black mb-2 tabular-nums" style={{ color: status.color }}>{db}<span className="text-2xl">dB</span></div>
        <div className="px-6 py-2 rounded-full border text-[10px] uppercase tracking-widest font-black" style={{ borderColor: status.color, color: status.color }}>{status.msg}</div>
        
        {/* Gráfico de riesgo acumulado */}
        <div className="w-full max-w-sm mt-8">
          <div className="flex justify-between text-[8px] uppercase tracking-widest text-slate-500 mb-2 font-black">
            <span>Riesgo Acumulado</span>
            <span>{Math.round(cumulativeRisk)}%</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${cumulativeRisk}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}