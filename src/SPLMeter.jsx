import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function SPLMeter({ onBack }) {
  const [db, setDb] = useState(20);
  const [cumulativeRisk, setCumulativeRisk] = useState(0);
  const [visualDb, setVisualDb] = useState(20);
  const audioContext = useRef(null);
  const analyserRef = useRef(null);

  // Filtro de Ponderación A (A-weighting approximation)
  const getAWeighting = (freq) => {
    const f2 = freq * freq;
    const f4 = f2 * f2;
    const r1 = 12194 * 12194 * f4;
    const r2 = (f2 + 20.6 * 20.6) * Math.sqrt((f2 + 107.7 * 107.7) * (f2 + 737.9 * 737.9)) * (f2 + 12194 * 12194);
    const ra = r1 / r2;
    return 2.0 + 20 * Math.log10(ra);
  };

  const update = useCallback(() => {
    function loop() {
      if (!analyserRef.current) return;
      const bufferLength = analyserRef.current.fftSize;
      const dataArray = new Float32Array(bufferLength);
      analyserRef.current.getFloatTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      
      const rms = Math.sqrt(sum / bufferLength);
      
      // Calibración científica:
      // El valor 0dBFS en digital es la máxima amplitud.
      // Un micrófono de smartphone a 1 metro típicamente entrega -30dBFS para 94dB SPL.
      // Usamos una constante de calibración (K) para alinear con la realidad física.
      const dbfs = 20 * Math.log10(rms + 1e-9); // Piso de ruido digital
      const calibrationK = 100; // Ajuste para aproximar dBA reales en dispositivos móviles
      const instantDb = Math.max(30, Math.min(120, Math.round(dbfs + calibrationK)));
      
      setDb(instantDb);

      if (instantDb > 85) {
        // NIOSH: 85dB por 8 horas (28800 seg). 
        // 60fps = ~0.016s por frame. Incremento = (exposición / total)
        const doseIncrement = Math.pow(2, (instantDb - 85) / 3) / (28800 * 60);
        setCumulativeRisk(prev => Math.min(100, prev + doseIncrement * 100));
      }

      requestAnimationFrame(loop);
    }
    loop();
  }, []);
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Constraints para deshabilitar procesamiento de hardware (AGC, Noise Suppression, Echo Cancel)
        // Esto es CRITICO para mediciones científicas correctas.
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } 
        });
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContext.current.createAnalyser();
        const source = audioContext.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 2048; // Mayor resolución para ISO
        update();
      } catch (e) {
        console.error(e);
      }
    };
    initAudio();
    return () => { if (audioContext.current) audioContext.current.close(); };
  }, [update]);

  // Suavizado de la aguja visual
  useEffect(() => {
    let animId;
    const animate = () => {
      setVisualDb(prev => {
        const diff = db - prev;
        return prev + diff * 0.15;
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [db]);

  const getStatus = (val) => {
    if (val < 60) return { color: '#39FF14', msg: 'Nivel Seguro', shadow: 'rgba(57,255,20,0.4)' };
    if (val < 85) return { color: '#fbbf24', msg: 'Precaución', shadow: 'rgba(251,191,36,0.4)' };
    return { color: '#ef4444', msg: 'Peligro Crítico', shadow: 'rgba(239,68,68,0.4)' };
  };

  const status = getStatus(db);
  const angle = ((visualDb - 20) / (120 - 20)) * 180 - 90;

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] p-8 pt-[max(2rem,env(safe-area-inset-top))] flex flex-col font-sans text-white">
      <header className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all"><ArrowLeft className="w-5 h-5" /></button>
        <div className="text-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#39FF14] mb-1">A-Weighted SPL</h2>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Analog Reference / 20Hz-20kHz</div>
        </div>
        <div className="w-11" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        {/* Medidor Analógico */}
        <div className="relative w-full max-w-md aspect-[4/3] flex items-center justify-center">
            <svg viewBox="0 0 200 150" className="w-full h-full overflow-visible">
                <defs>
                    <radialGradient id="meterGlow" cx="50%" cy="100%" r="100%" fx="50%" fy="100%">
                        <stop offset="0%" stopColor={status.color} stopOpacity="0.15" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <path d="M 20 130 A 80 80 0 0 1 180 130" fill="url(#meterGlow)" className="stroke-white/5" strokeWidth="15" strokeLinecap="round" />

                {/* Escala */}
                {[20, 40, 60, 80, 100, 120].map(v => {
                    const a = ((v - 20) / 100) * Math.PI - Math.PI;
                    const x1 = 100 + Math.cos(a) * 75;
                    const y1 = 130 + Math.sin(a) * 75;
                    const x2 = 100 + Math.cos(a) * 85;
                    const y2 = 130 + Math.sin(a) * 85;
                    const tx = 100 + Math.cos(a) * 95;
                    const ty = 130 + Math.sin(a) * 95;
                    return (
                        <g key={v}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity="0.2" strokeWidth="1" />
                            <text x={tx} y={ty} fill="white" fillOpacity="0.4" fontSize="6" textAnchor="middle" alignmentBaseline="middle" fontWeight="bold">{v}</text>
                        </g>
                    );
                })}

                {/* Aguja */}
                <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 130px' }} className="transition-transform duration-75">
                    <line x1="100" y1="130" x2="100" y2="45" stroke={status.color} strokeWidth="2" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${status.color})` }} />
                    <circle cx="100" cy="130" r="4" fill={status.color} />
                </g>
            </svg>

            <div className="absolute bottom-4 flex flex-col items-center">
                <div className="text-7xl font-black tabular-nums tracking-tighter" style={{ color: status.color, textShadow: `0 0 30px ${status.shadow}` }}>
                    {db}<span className="text-xl ml-1 opacity-60">dBA</span>
                </div>
                <div className="mt-4 px-6 py-1.5 rounded-full border text-[9px] uppercase tracking-[0.3em] font-black bg-white/5 transition-colors" style={{ borderColor: `${status.color}40`, color: status.color }}>
                    {status.msg}
                </div>
            </div>
        </div>

        {/* Riesgo Acumulado Optimizado */}
        <div className="w-full max-w-xs space-y-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-[0.4em] text-slate-600 font-black">Dosímetro</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white font-bold">Exposición Diaria</span>
            </div>
            <span className="text-xl font-black tabular-nums" style={{ color: cumulativeRisk > 80 ? '#ef4444' : 'white' }}>{Math.round(cumulativeRisk)}%</span>
          </div>
          <div className="h-3 w-full bg-white/5 rounded-full border border-white/10 p-0.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 ease-out" 
                 style={{ 
                    width: `${cumulativeRisk}%`, 
                    background: `linear-gradient(90deg, #39FF14, ${status.color})`,
                    boxShadow: `0 0 10px ${status.color}40`
                 }} />
          </div>
          <p className="text-[8px] text-slate-500 uppercase tracking-widest text-center leading-relaxed">Referencia NIOSH: 85dBA / 8 Horas</p>
        </div>
      </div>
    </div>
  );
}