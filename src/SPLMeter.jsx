import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function SPLMeter({ onBack }) {
  const [db, setDb] = useState(20);
  const [cumulativeRisk, setCumulativeRisk] = useState(0);
  const [visualDb, setVisualDb] = useState(20);
  
  const audioContext = useRef(null);
  const analyserRef = useRef(null);
  const reqIdRef = useRef(null);
  
  // OPTIMIZACIÓN ZERO-COPY: Buffer pre-asignado
  const dataArrayRef = useRef(null);

  // Filtro de Ponderación A (A-weighting approximation ISO)
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
      if (!analyserRef.current || !audioContext.current) return;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      
      // ZERO-COPY: Evitamos saturar el Garbage Collector a 60 FPS
      if (!dataArrayRef.current || dataArrayRef.current.length !== bufferLength) {
        dataArrayRef.current = new Float32Array(bufferLength);
      }
      
      const dataArray = dataArrayRef.current;
      
      // EXTRACCIÓN CIENTÍFICA: Ahora usamos el dominio de la frecuencia
      analyserRef.current.getFloatFrequencyData(dataArray);

      let sumPower = 0;
      const sampleRate = audioContext.current.sampleRate;
      const nyquist = sampleRate / 2;

      for (let i = 0; i < bufferLength; i++) {
        const freq = (i * nyquist) / bufferLength;
        
        // Descartar frecuencias fuera del rango auditivo útil para no falsear el dBA
        if (freq < 20 || freq > 20000) continue;

        const dbfs = dataArray[i];
        if (dbfs === -Infinity) continue;

        // Ponderación A: Restamos/Sumamos decibelios según la sensibilidad humana
        const aWeight = getAWeighting(freq);
        const weightedDbfs = dbfs + aWeight;

        // Para sumar decibelios, debemos convertirlos a potencia lineal primero
        sumPower += Math.pow(10, weightedDbfs / 10);
      }
      
      // Volver a decibelios y aplicar la constante de calibración K para micrófonos móviles
      const totalDbfs = 10 * Math.log10(sumPower + 1e-12);
      const calibrationK = 115; // Ajuste empírico aproximado a presión sonora real
      const instantDb = Math.max(30, Math.min(120, Math.round(totalDbfs + calibrationK)));
      
      setDb(instantDb);

      // Dosímetro NIOSH
      if (instantDb > 85) {
        const doseIncrement = Math.pow(2, (instantDb - 85) / 3) / (28800 * 60);
        setCumulativeRisk(prev => Math.min(100, prev + doseIncrement * 100));
      }

      reqIdRef.current = requestAnimationFrame(loop);
    }
    loop();
  }, []);

  useEffect(() => {
    const initAudio = async () => {
      try {
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
        
        // Alta resolución (4096 bins) para captar con precisión la curva de ecualización A
        analyserRef.current.fftSize = 4096; 
        update();
      } catch (e) {
        console.error(e);
      }
    };
    initAudio();
    
    return () => { 
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
        if (audioContext.current) audioContext.current.close(); 
    };
  }, [update]);

  // Suavizado de la aguja visual para UX "Noir-Tech"
  useEffect(() => {
    let animId;
    const animate = () => {
      setVisualDb(prev => {
        const diff = db - prev;
        // Ajustamos la velocidad de respuesta de la aguja (Balística del medidor)
        const factor = Math.abs(diff) > 10 ? 0.2 : 0.1; 
        return prev + diff * factor;
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
  // Ajuste fino del ángulo para que coincida perfectamente con la escala de 20 a 120 dB
  const angle = ((visualDb - 20) / (120 - 20)) * 180 - 90;

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] p-8 pt-[max(2rem,env(safe-area-inset-top))] flex flex-col font-sans text-white">
      <header className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all"><ArrowLeft className="w-5 h-5" /></button>
        <div className="text-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#39FF14] mb-1">A-Weighted SPL</h2>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Scientific Reference / 20Hz-20kHz</div>
        </div>
        <div className="w-11" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        <div className="relative w-full max-w-md aspect-[4/3] flex items-center justify-center">
            <svg viewBox="0 0 200 150" className="w-full h-full overflow-visible">
                <defs>
                    <radialGradient id="meterGlow" cx="50%" cy="100%" r="100%" fx="50%" fy="100%">
                        <stop offset="0%" stopColor={status.color} stopOpacity="0.15" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <path d="M 20 130 A 80 80 0 0 1 180 130" fill="url(#meterGlow)" className="stroke-white/5" strokeWidth="15" strokeLinecap="round" />

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

        <div className="w-full max-w-xs space-y-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-[0.4em] text-slate-600 font-black">Dosímetro NIOSH</span>
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
          <p className="text-[8px] text-slate-500 uppercase tracking-widest text-center leading-relaxed">Ponderación A Aplicada (Real-time DSP)</p>
        </div>
      </div>
    </div>
  );
}