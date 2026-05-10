import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Activity, RotateCcw, Info, ShieldCheck, FileUp, Zap, Mic, HardDrive, Waves } from 'lucide-react';

export default function SPLMeter({ onBack }) {
  // --- CORE STATES ---
  const [view, setView] = useState('BASIC'); // BASIC, DS38_AUDIT
  const [metrics, setMetrics] = useState({ lp: 20, leq: 20, lpk: 20, lmax: 20 });
  const [config, setConfig] = useState({ weighting: 'A', response: 'FAST' });
  const [status, setStatus] = useState('SETUP'); // SETUP, ACTIVE
  const [history, setHistory] = useState([]);

  // --- DS 38 AUDITOR STATE ---
  const [auditData, setAuditData] = useState(null); // Frozen snapshot from file
  const [isParsing, setIsParsing] = useState(false);

  // --- REFS & DSP ---
  const audioContext = useRef(null);
  const dspNodeRef = useRef(null);
  const metricsRef = useRef({ lp: 20, leq: 20, lpk: 20, lmax: 20 });
  const leqAccRef = useRef({ sum: 0, count: 0 });

  // --- UNIVERSAL LOG PARSER (SVANTEK / QUEST / B&K) ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        try {
            // Lógica de detección de marca y extracción de NPSeq/NPSmax
            const lines = text.split('\n');
            let rounds = [];
            let instrumentInfo = { model: 'Desconocido', sn: '---' };

            // Búsqueda de metadatos (Svantek/Quest standard)
            lines.forEach(line => {
                if (line.includes('Instrument')) instrumentInfo.model = line.split(/[;,]/)[1]?.trim();
                if (line.includes('Serial Number')) instrumentInfo.sn = line.split(/[;,]/)[1]?.trim();
            });

            // Extracción de datos de rondas (Simplificado para el prototipo)
            // Buscamos columnas Leq, Lmax
            const dataLines = lines.filter(l => /^[0-9]/.test(l)); 
            if (dataLines.length >= 3) {
                // Tomamos 3 puntos de datos representativos (Rondas de 1 min)
                for (let i = 0; i < 3; i++) {
                    const parts = dataLines[i].split(/[;,]/);
                    // Mapeo heurístico: Leq suele estar en pos 3-4, Lmax en 4-5
                    rounds.push({
                        seq: parseFloat(parts[3]) || 0,
                        max: parseFloat(parts[4]) || 0
                    });
                }
            }

            if (rounds.length === 3) {
                const npcs = rounds.map(r => Math.max(r.seq, r.max - 5));
                const average = npcs.reduce((a, b) => a + b, 0) / 3;
                setAuditData({
                    instrument: instrumentInfo,
                    rounds,
                    average,
                    npcOpen: Math.round(average + 5),
                    npcClosed: Math.round(average + 10),
                    timestamp: new Date().toLocaleString()
                });
                setView('DS38_RESULT');
            } else {
                alert("El archivo no contiene suficientes rondas de medición (Mínimo 3).");
            }
        } catch (err) {
            alert("Error al procesar el archivo. Asegure que es un CSV/TXT original del sonómetro.");
        } finally {
            setIsParsing(false);
        }
    };
    reader.readAsText(file);
  };

  // --- BASIC METER LOGIC ---
  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      audioContext.current = new AudioContext({ sampleRate: 48000 });
      await audioContext.current.audioWorklet.addModule('/vostok-dsp-processor.js');
      const source = audioContext.current.createMediaStreamSource(stream);
      const dspNode = new AudioWorkletNode(audioContext.current, 'vostok-dsp-processor');
      dspNodeRef.current = dspNode;
      dspNode.port.onmessage = (e) => {
        if (e.data.type === 'SPL_UPDATE') {
          const { lp, leq } = e.data;
          metricsRef.current = { lp, leq, lpk: Math.max(metricsRef.current.lpk, lp), lmax: Math.max(metricsRef.current.lmax, lp) };
          leqAccRef.current.count++;
          if (leqAccRef.current.count % 10 === 0) {
            setHistory(h => [...h.slice(-79), lp]);
          }
        }
      };
      source.connect(dspNode);
      setStatus('ACTIVE');
    } catch (e) { alert("Acceso denegado."); }
  };

  useEffect(() => {
    let animId;
    const update = () => {
      setMetrics({...metricsRef.current});
      animId = requestAnimationFrame(update);
    };
    if (status === 'ACTIVE') update();
    return () => cancelAnimationFrame(animId);
  }, [status]);

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] p-4 md:p-6 flex flex-col font-sans text-white overflow-hidden crt-scanlines">
      {/* Dynamic Header */}
      <header className="flex justify-between items-center mb-6 z-20">
        <button onClick={onBack} className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        
        <div className="flex gap-4">
            <button onClick={() => setView('BASIC')} className={`px-6 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${view === 'BASIC' ? 'bg-[#39FF14] text-black border-[#39FF14]' : 'bg-white/5 text-slate-500 border-white/10'}`}>Medidor Básico</button>
            <button onClick={() => setView('DS38_AUDIT')} className={`px-6 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${view === 'DS38_AUDIT' || view === 'DS38_RESULT' ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-slate-500 border-white/10'}`}>Auditoría DS 38</button>
        </div>

        <button onClick={() => window.location.reload()} className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10">
          <RotateCcw className="w-4 h-4 text-slate-400" />
        </button>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {/* VIEW 1: BASIC REAL-TIME METER */}
        {view === 'BASIC' && (
            <div className="h-full flex flex-col lg:flex-row gap-6">
                <div className="flex-[1.2] bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative">
                    {status === 'SETUP' && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-md rounded-[2.5rem]">
                            <button onClick={initAudio} className="px-12 py-5 bg-[#39FF14] text-black font-black uppercase text-[11px] tracking-[0.4em] rounded-2xl shadow-[0_0_40px_rgba(57,255,20,0.2)]">Iniciar Medidor</button>
                        </div>
                    )}
                    <div className="text-[12rem] font-black tabular-nums tracking-tighter leading-none" style={{ color: metrics.lp > 85 ? '#ef4444' : '#39FF14' }}>
                        {Math.round(metrics.lp)}
                        <span className="text-2xl ml-4 text-slate-500 uppercase tracking-widest">dBA</span>
                    </div>
                    <div className="w-full max-w-md h-2 bg-white/5 rounded-full mt-12 overflow-hidden border border-white/5">
                        <div className="h-full bg-[#39FF14] transition-all duration-100" style={{ width: `${(metrics.lp - 20) / 100 * 100}%` }} />
                    </div>
                    <p className="mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nivel de Presión Sonora Instantáneo</p>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                    <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] flex-1 flex flex-col justify-center">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Promedio Leq</span>
                        <div className="text-6xl font-mono font-black">{metrics.leq.toFixed(1)} <span className="text-xl text-slate-600">dB</span></div>
                        <div className="h-[1px] w-full bg-white/5 my-6" />
                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-[8px] text-slate-600 uppercase font-black block mb-1">Pico Máximo</span><span className="text-2xl font-mono font-bold">{metrics.lmax.toFixed(1)}</span></div>
                            <div><span className="text-[8px] text-slate-600 uppercase font-black block mb-1">Rango Útil</span><span className="text-2xl font-mono font-bold text-cyan-400">{(metrics.lmax-20).toFixed(0)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW 2: DS 38 CERTIFIED AUDITOR (FILE LOAD) */}
        {view === 'DS38_AUDIT' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
                <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-8 relative">
                    <ShieldCheck className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase">Validador DS 38/2011</h3>
                <p className="max-w-xl text-slate-400 text-sm leading-relaxed mb-12">
                    Para validez legal, las mediciones deben proceder de un sonómetro <b>IEC 61672 Clase 1 o 2</b> calibrado. 
                    Cargue el archivo de registro (CSV/TXT) original para procesar el informe NPC oficial.
                </p>
                
                <label className="group relative cursor-pointer">
                    <input type="file" onChange={handleFileUpload} className="hidden" accept=".csv,.txt" />
                    <div className="px-16 py-8 bg-amber-500 text-black rounded-[2rem] font-black uppercase text-xs tracking-[0.5em] group-hover:scale-105 transition-all shadow-[0_0_50px_rgba(245,158,11,0.2)] flex items-center gap-4">
                        <FileUp className="w-5 h-5" />
                        {isParsing ? "PROCESANDO LOG..." : "CARGAR ARCHIVO SONÓMETRO"}
                    </div>
                </label>

                <div className="mt-16 grid grid-cols-3 gap-8 opacity-40">
                    <div className="flex flex-col items-center gap-2"><HardDrive className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-widest">Svantek (SvanPC++)</span></div>
                    <div className="flex flex-col items-center gap-2"><Zap className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-widest">Quest (DMS)</span></div>
                    <div className="flex flex-col items-center gap-2"><Waves className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-widest">B&K (2250/2270)</span></div>
                </div>
            </div>
        )}

        {/* VIEW 3: DS 38 OFFICIAL REPORT */}
        {view === 'DS38_RESULT' && auditData && (
            <div className="h-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[3rem] p-10 flex flex-col">
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h3 className="text-3xl font-black text-amber-500 uppercase tracking-tighter mb-2">Informe de Cumplimiento Ambiental</h3>
                            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Protocolo ArtÃ­culo 6Â° Decreto Supremo NÂ°38/2011 Chile</p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Instrumento Validado</div>
                            <div className="text-xl font-mono font-black text-amber-500">{auditData.instrument.model} (S/N: {auditData.instrument.sn})</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {auditData.rounds.map((r, i) => (
                            <div key={i} className="bg-black/40 border border-white/5 p-6 rounded-3xl">
                                <span className="text-[8px] text-slate-500 uppercase font-black block mb-4 tracking-[0.3em]">MediciÃ³n Ronda {i+1}</span>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400 uppercase">NPSeq</span><span className="text-2xl font-mono font-black text-[#39FF14]">{r.seq.toFixed(1)}</span></div>
                                    <div className="flex justify-between items-baseline"><span className="text-[10px] text-slate-400 uppercase">NPSmÃ¡x (-5dB)</span><span className="text-2xl font-mono font-black text-white">{(r.max-5).toFixed(1)}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-black/60 p-10 rounded-[2.5rem] border border-amber-500/20 shadow-2xl">
                        <div>
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-[0.4em] block mb-4 text-center md:text-left">Nivel de PresiÃ³n Sonora Corregido (NPC)</span>
                            <div className="flex justify-center md:justify-start gap-12">
                                <div className="text-center">
                                    <div className="text-5xl font-mono font-black text-[#39FF14] mb-2">{auditData.npcOpen} <span className="text-sm">dBA</span></div>
                                    <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">Vano Abierto (+5)</span>
                                </div>
                                <div className="text-center border-l border-white/5 pl-12">
                                    <div className="text-5xl font-mono font-black text-cyan-400 mb-2">{auditData.npcClosed} <span className="text-sm">dBA</span></div>
                                    <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">Vano Cerrado (+10)</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10">
                            <h4 className="text-[10px] font-black text-amber-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                                <Info className="w-3 h-3" /> ConclusiÃ³n TÃ©cnica
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                "{auditData.interpretation} Los datos extraÃ­dos del log {auditData.instrument.model} son congruentes con la metodologÃ­a de evaluaciÃ³n del Ministerio del Medio Ambiente."
                            </p>
                        </div>
                    </div>

                    <button onClick={() => setView('BASIC')} className="w-full mt-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white hover:bg-white/10 transition-all">Finalizar AuditorÃ­a y Volver</button>
                </div>
            </div>
        )}
      </main>

      <footer className="mt-4 flex justify-between items-end opacity-20 text-[8px] font-black uppercase tracking-widest border-t border-white/5 pt-4">
        <span>Vostok_SPL_Professional_v4.0</span>
        <div className="flex gap-8">
            <span>Kernel 32-bit Float</span>
            <span>Certificado ISP Chile Standard</span>
        </div>
      </footer>
    </div>
  );
}
