import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Activity, Zap, Info, Square } from 'lucide-react';

// --- VOSTOK FFT KERNEL (RADIX-2) ---
const fft = (re, im, invert = false) => {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            [re[i], re[j]] = [re[j], re[i]];
            [im[i], im[j]] = [im[j], im[i]];
        }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = 2 * Math.PI / len * (invert ? -1 : 1);
        const wlenRe = Math.cos(ang);
        const wlenIm = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
            let wRe = 1;
            let wIm = 0;
            for (let j = 0; j < len / 2; j++) {
                const uRe = re[i + j];
                const uIm = im[i + j];
                const vRe = re[i + j + len / 2] * wRe - im[i + j + len / 2] * wIm;
                const vIm = re[i + j + len / 2] * wIm + im[i + j + len / 2] * wRe;
                re[i + j] = uRe + vRe;
                im[i + j] = uIm + vIm;
                re[i + j + len / 2] = uRe - vRe;
                im[i + j + len / 2] = uIm - vIm;
                const tmpRe = wRe * wlenRe - wIm * wlenIm;
                wIm = wRe * wlenIm + wIm * wlenRe;
                wRe = tmpRe;
            }
        }
    }
    if (invert) {
        for (let i = 0; i < n; i++) {
            re[i] /= n;
            im[i] /= n;
        }
    }
};

const calculateRegression = (data, startIdx, endIdx, sr) => {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = endIdx - startIdx;
    if (n <= 1) return null;

    for (let i = startIdx; i < endIdx; i++) {
        const x = i / sr;
        const y = data[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope !== 0 ? -60 / slope : null;
};

const analyzeImpulse = (hRe, sr) => {
    const n = hRe.length;
    const energy = new Float32Array(n);
    let maxEnergy = 0;
    let peakIdx = 0;

    for (let i = 0; i < n; i++) {
        energy[i] = hRe[i] * hRe[i];
        if (energy[i] > maxEnergy) {
            maxEnergy = energy[i];
            peakIdx = i;
        }
    }

    // 1. Detección de "Time Zero" (Escaneo de precisión)
    let t0 = peakIdx;
    const arrivalThreshold = maxEnergy * 0.001; // -30dB
    while (t0 > 0 && energy[t0] > arrivalThreshold) t0--;

    // 2. Estimación de Ruido (Lundeby Iterativo Simplificado)
    // Escaneamos el final del buffer para encontrar la cola estable
    let noiseFloor = 0;
    const tailStart = Math.floor(n * 0.8);
    for (let i = tailStart; i < n; i++) noiseFloor += energy[i];
    noiseFloor /= (n - tailStart);

    // 3. Integración de Schroeder con Compensación de Ruido
    const schroeder = new Float32Array(n);
    let sum = 0;
    
    // Punto de cruce: donde el IR toca el ruido + 3dB
    let crossPoint = n - 1;
    for (let i = peakIdx; i < n; i++) {
        if (energy[i] < noiseFloor * 2) {
            crossPoint = i;
            break;
        }
    }

    for (let i = crossPoint; i >= t0; i--) {
        // Restamos el ruido estimado para limpiar la curva (ISO 3382-2)
        sum += Math.max(0, energy[i] - noiseFloor);
        schroeder[i] = sum;
    }

    const schroederDB = new Float32Array(n);
    const maxSchroeder = schroeder[t0] || 1e-10;
    for (let i = t0; i < n; i++) {
        schroederDB[i] = 10 * Math.log10(Math.max(schroeder[i] / maxSchroeder, 1e-10));
    }

    const findIdx = (dbTarget) => {
        for (let i = t0; i < n; i++) if (schroederDB[i] <= dbTarget) return i;
        return -1;
    };

    const idx0 = t0;
    const idx5 = findIdx(-5);
    const idx10 = findIdx(-10);
    const idx25 = findIdx(-25);
    const idx35 = findIdx(-35);

    const edt = calculateRegression(schroederDB, idx0, idx10, sr);
    const t20 = idx25 !== -1 ? calculateRegression(schroederDB, idx5, idx25, sr) : null;
    const t30 = idx35 !== -1 ? calculateRegression(schroederDB, idx5, idx35, sr) : null;

    let e50 = 0, e80 = 0, eTotal = 0;
    const samples50ms = Math.floor(0.050 * sr);
    const samples80ms = Math.floor(0.080 * sr);

    for (let i = t0; i < crossPoint; i++) {
        const e = energy[i];
        if (i - t0 < samples50ms) e50 += e;
        if (i - t0 < samples80ms) e80 += e;
        eTotal += e;
    }

    const d50 = eTotal > 0 ? (e50 / eTotal) * 100 : 0;
    const c80 = eTotal > e80 ? 10 * Math.log10(e80 / (eTotal - e80 + 1e-10)) : 0;
    const snr = 10 * Math.log10(maxEnergy / (noiseFloor + 1e-10));

    return { edt, t20, t30, c80, d50, snr, t0, crossPoint };
};

export default function ImpulseResponse({ onBack }) {
    const SAMPLE_RATE = 48000;
    const [status, setStatus] = useState('IDLE');
    const [mode, setMode] = useState('STANDARD');
    const [showGuide, setShowGuide] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [progress, setProgress] = useState(0);
    const [irData, setIrData] = useState(null);
    const [metrics, setMetrics] = useState({
        edt: null, t20: null, t30: null, c80: null, d50: null, snr: null
    });
    
    // Audio Device States
    const [inputs, setInputs] = useState([]);
    const [outputs, setInputsOutputs] = useState([]); // outputs
    const [selectedInput, setSelectedInput] = useState('default');
    const [selectedOutput, setSelectedOutput] = useState('default');

    const fetchDevices = useCallback(async () => {
        try {
            // Pedimos permiso primero para que las etiquetas de los dispositivos sean visibles
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devs = await navigator.mediaDevices.enumerateDevices();
            setInputs(devs.filter(d => d.kind === 'audioinput'));
            setInputsOutputs(devs.filter(d => d.kind === 'audiooutput'));
        } catch (e) {
            console.error("Error listing devices:", e);
        }
    }, []);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);
    
    const audioCtx = useRef(null);
    const sweepBuffer = useRef(null);
    const recordedBuffer = useRef(null);
    const canvasRef = useRef(null);
    const freqCanvasRef = useRef(null);
    const streamRef = useRef(null);
    const isMeasuringRef = useRef(false);

    const MODES = {
        FAST: { duration: 1.0, tail: 1.0, label: 'Básico (1s)' },
        STANDARD: { duration: 3.0, tail: 2.0, label: 'Estándar (3s)' },
        STUDIO: { duration: 10.0, tail: 3.0, label: 'Estudio (10s)' }
    };

    const generateSweep = (duration, sr) => {
        const N = Math.floor(duration * sr);
        const buffer = new Float32Array(N);
        const f1 = 20;
        const f2 = 20000;
        const R = Math.log(f2 / f1);
        for (let i = 0; i < N; i++) {
            const t = i / sr;
            const phase = 2 * Math.PI * f1 * duration * (Math.exp(t * R / duration) - 1) / R;
            let window = 1.0;
            if (i < 500) window = i / 500;
            if (i > N - 500) window = (N - i) / 500;
            buffer[i] = Math.sin(phase) * window;
        }
        return buffer;
    };

    const startMeasurement = async () => {
        try {
            const constraints = {
                audio: { 
                    echoCancellation: false, 
                    noiseSuppression: false, 
                    autoGainControl: false,
                    deviceId: selectedInput !== 'default' ? { exact: selectedInput } : undefined
                } 
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
            
            // Intentar enrutar salida a interfaz externa (Chrome/Brave support)
            if (selectedOutput !== 'default' && typeof ctx.setSinkId === 'function') {
                await ctx.setSinkId(selectedOutput);
                console.log(`[Vostok Hardware] Output routed to: ${selectedOutput}`);
            }

            audioCtx.current = ctx;
            
            setStatus('COUNTDOWN');
            let count = 3;
            setCountdown(count);
            const timer = setInterval(() => {
                count--;
                setCountdown(count);
                if (count === 0) {
                    clearInterval(timer);
                    runSweep();
                }
            }, 1000);
        } catch (e) {
            console.error(e);
            alert("Error al acceder al hardware. Verifique los permisos.");
        }
    };

    const runSweep = async () => {
        if (!audioCtx.current) return;
        setStatus('MEASURING');
        isMeasuringRef.current = true;
        
        const currentMode = MODES[mode];
        const sr = audioCtx.current.sampleRate;
        const sweepData = generateSweep(currentMode.duration, sr);
        sweepBuffer.current = sweepData;

        const buffer = audioCtx.current.createBuffer(1, sweepData.length, sr);
        buffer.getChannelData(0).set(sweepData);

        const source = audioCtx.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.current.destination);

        const recorder = audioCtx.current.createScriptProcessor(4096, 1, 1);
        const recordingLength = Math.floor((currentMode.duration + currentMode.tail) * sr);
        const recordedData = new Float32Array(recordingLength);
        let offset = 0;

        recorder.onaudioprocess = (event) => {
            if (!isMeasuringRef.current) return;
            const input = event.inputBuffer.getChannelData(0);
            if (offset < recordingLength) {
                const len = Math.min(input.length, recordingLength - offset);
                recordedData.set(input.subarray(0, len), offset);
                offset += len;
                if (offset % 16384 === 0 || offset >= recordingLength) {
                    setProgress(offset / recordingLength);
                }
            } else {
                isMeasuringRef.current = false;
                source.stop();
                recorder.disconnect();
                finishRecording(recordedData);
            }
        };

        const micSource = audioCtx.current.createMediaStreamSource(streamRef.current);
        micSource.connect(recorder);
        recorder.connect(audioCtx.current.destination);
        source.start();
    };

    const finishRecording = (data) => {
        recordedBuffer.current = data;
        setStatus('PROCESSING');
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        setTimeout(deconvolve, 100);
    };

    const deconvolve = () => {
        const sr = SAMPLE_RATE;
        let N = 1;
        while (N < (recordedBuffer.current?.length || 0)) N <<= 1;
        if (N < 2) { setStatus('IDLE'); return; }
        
        const sweep = sweepBuffer.current;
        const recorded = recordedBuffer.current;
        
        const S_re = new Float32Array(N);
        const S_im = new Float32Array(N);
        const R_re = new Float32Array(N);
        const R_im = new Float32Array(N);
        
        if (sweep) S_re.set(sweep);
        if (recorded) R_re.set(recorded.subarray(0, Math.min(recorded.length, N)));
        
        fft(S_re, S_im);
        fft(R_re, R_im);
        
        const H_re = new Float32Array(N);
        const H_im = new Float32Array(N);
        const lambda = 1e-4;
        
        for (let i = 0; i < N; i++) {
            const magS2 = S_re[i] * S_re[i] + S_im[i] * S_im[i] + lambda;
            H_re[i] = (R_re[i] * S_re[i] + R_im[i] * S_im[i]) / magS2;
            H_im[i] = (R_im[i] * S_re[i] - R_re[i] * S_im[i]) / magS2;
        }
        
        fft(H_re, H_im, true);
        
        const analysis = analyzeImpulse(H_re, sr);
        setMetrics({
            edt: analysis.edt,
            t20: analysis.t20,
            t30: analysis.t30,
            c80: analysis.c80,
            d50: analysis.d50,
            snr: analysis.snr
        });

        // --- LAB GRADE WINDOWING ---
        // Generamos un IR de 1.5s para software de análisis (incluyendo 20ms de pre-delay)
        const irResult = new Float32Array(sr * 1.5);
        const preDelaySamples = Math.floor(sr * 0.020); // 20ms de pre-impulso para REW
        const startOffset = (analysis.t0 - preDelaySamples + N) % N;
        
        for (let i = 0; i < irResult.length; i++) {
            irResult[i] = H_re[(startOffset + i) % N];
        }
        
        // Normalización Lab (a -0.1dBFS)
        let peak = 1e-10;
        for (let i = 0; i < irResult.length; i++) if (Math.abs(irResult[i]) > peak) peak = Math.abs(irResult[i]);
        const gain = 0.99 / peak;
        for (let i = 0; i < irResult.length; i++) irResult[i] *= gain;

        setIrData(irResult);
        
        const freqRes = new Float32Array(N / 2);
        fft(H_re, H_im);
        for (let i = 0; i < N / 2; i++) {
            const mag = Math.sqrt(H_re[i] * H_re[i] + H_im[i] * H_im[i]);
            freqRes[i] = 20 * Math.log10(Math.max(mag, 1e-6));
        }

        const smoothedFreq = new Float32Array(N / 2);
        const octStep = Math.pow(2, 1/12);
        for (let i = 1; i < N / 2; i++) {
            const f = i * sr / N;
            const binLow = Math.max(1, Math.floor((f / octStep) * N / sr));
            const binHigh = Math.min(N/2 - 1, Math.ceil((f * octStep) * N / sr));
            let sum = 0, count = 0;
            for (let b = binLow; b <= binHigh; b++) { sum += freqRes[b]; count++; }
            smoothedFreq[i] = sum / (count || 1);
        }
        
        setStatus('FINISHED');
        setTimeout(() => {
            if (canvasRef.current) drawIR(irResult);
            if (freqCanvasRef.current) drawFreq(smoothedFreq, N);
        }, 100);
    };

    const drawIR = (data) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.clearRect(0, 0, w, h);
        
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.05)';
        for (let db of [0, -10, -20, -30, -40, -50, -60]) {
            const y = (db / -60) * h;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const displayLen = Math.floor(data.length * 0.8);
        for (let i = 0; i < w; i++) {
            const db = 20 * Math.log10(Math.max(Math.abs(data[Math.floor(i * displayLen / w)]), 1e-3));
            const y = (db / -60) * h;
            if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
        }
        ctx.stroke();
    };

    const drawFreq = (data, N) => {
        const canvas = freqCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.clearRect(0, 0, w, h);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (let f of [20, 100, 1000, 10000, 20000]) {
            const x = (Math.log10(f) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * w;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let maxDB = -Infinity;
        for (let i = 0; i < N/2; i++) if (data[i] > maxDB) maxDB = data[i];

        for (let i = 0; i < w; i++) {
            const freq = 20 * Math.pow(1000, i / w);
            const val = data[Math.floor(freq * N / 48000)] - (maxDB || 0);
            const y = h - ((val + 60) / 60) * h;
            if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
        }
        ctx.stroke();
    };

    const safeValue = (val, suffix = '', precision = 2) => {
        if (val === null || val === undefined || isNaN(val)) return '--';
        return val.toFixed(precision) + suffix;
    };

    return (
        <div className="fixed inset-0 bg-[#010101] grid-bg z-[100] p-4 md:p-8 flex flex-col font-sans text-white overflow-hidden crt-scanlines">
            <header className="flex justify-between items-center mb-8 z-20">
                <button onClick={onBack} className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div className="text-center bg-white/[0.03] border border-white/10 px-10 py-3 rounded-2xl shadow-xl">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#39FF14] flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        VOSTOK IR MEASURER
                    </h2>
                </div>
                <div className="w-12 h-12" />
            </header>

            <main className="flex-1 flex flex-col gap-6 relative z-10 overflow-hidden">
                {status === 'IDLE' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-[#39FF14]/5 border border-[#39FF14]/20 flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 bg-[#39FF14] blur-2xl opacity-10" />
                            <Zap className="w-10 h-10 text-[#39FF14]" />
                        </div>
                        <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase">Captura de Respuesta</h3>
                        
                        {/* Hardware Configuration */}
                        <div className="flex flex-col md:flex-row gap-4 mb-10 w-full max-w-2xl px-4">
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest pl-2">Entrada (Micrófono)</label>
                                <select 
                                    value={selectedInput} 
                                    onChange={(e) => setSelectedInput(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-300 outline-none focus:border-[#39FF14]/40 transition-colors"
                                >
                                    <option value="default">Default Input</option>
                                    {inputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Interface ${d.deviceId.slice(0,5)}`}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest pl-2">Salida (Altavoz)</label>
                                <select 
                                    value={selectedOutput} 
                                    onChange={(e) => setSelectedOutput(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-300 outline-none focus:border-[#39FF14]/40 transition-colors"
                                >
                                    <option value="default">Default Output</option>
                                    {outputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Monitor ${d.deviceId.slice(0,5)}`}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mb-10">
                            {Object.entries(MODES).map(([k, v]) => (
                                <button key={k} onClick={() => setMode(k)} className={`px-6 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${mode === k ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]' : 'bg-white/5 border-white/5 text-slate-500'}`}>{v.label}</button>
                            ))}
                        </div>
                        <button onClick={startMeasurement} className="px-12 py-5 bg-[#39FF14] text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-all">Iniciar Secuencia</button>
                    </div>
                )}

                {status === 'COUNTDOWN' && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-[12rem] font-black text-[#39FF14]">{countdown}</div>
                    </div>
                )}

                {(status === 'MEASURING' || status === 'PROCESSING') && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-64 h-64 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                            <div className="text-center">
                                <span className="text-4xl font-black font-mono">{Math.round(progress * 100)}%</span>
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">{status === 'MEASURING' ? 'CAPTURANDO' : 'PROCESANDO'}</div>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'FINISHED' && (
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full overflow-hidden">
                            <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
                                <div className="flex-1 bg-black/40 border border-white/10 rounded-[1.5rem] p-4 flex flex-col relative overflow-hidden">
                                    <span className="text-[9px] font-black text-[#39FF14] uppercase tracking-[0.2em] mb-2">Energy Time Curve (ETC)</span>
                                    <canvas ref={canvasRef} className="flex-1 w-full" />
                                </div>
                                <div className="flex-1 bg-black/40 border border-white/10 rounded-[1.5rem] p-4 flex flex-col relative overflow-hidden">
                                    <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-2">Frequency Response</span>
                                    <canvas ref={freqCanvasRef} className="flex-1 w-full" />
                                </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-6 flex flex-col gap-6 overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ISO 3382</span>
                                    <button onClick={() => setShowGuide(true)}><Info className="w-4 h-4 text-[#39FF14]" /></button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {/* Categoría: Reverberación Physical */}
                                    <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                                        <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-3 block">Reverberación Physical</span>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[7px] text-slate-500 uppercase mb-1">EDT (Percepción)</div>
                                                <div className="text-xl font-mono font-black text-[#39FF14]">{safeValue(metrics.edt, 's')}</div>
                                            </div>
                                            <div>
                                                <div className="text-[7px] text-slate-500 uppercase mb-1">T30 (Físico)</div>
                                                <div className="text-xl font-mono font-black text-white">{safeValue(metrics.t30, 's')}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Categoría: Energía & Claridad */}
                                    <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                                        <span className="text-[8px] font-black text-cyan-600 uppercase tracking-widest mb-3 block">Inteligibilidad & Energía</span>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[7px] text-slate-500 uppercase mb-1">C80 (Música)</div>
                                                <div className="text-xl font-mono font-black text-cyan-400">{safeValue(metrics.c80, ' dB', 1)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[7px] text-slate-500 uppercase mb-1">D50 (Palabra)</div>
                                                <div className="text-xl font-mono font-black text-cyan-600">{safeValue(metrics.d50, '%', 1)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Categoría: Salud de la Medida */}
                                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-[7px] text-slate-500 uppercase mb-1">SNR (Calidad ISO)</div>
                                                <div className={`text-sm font-mono font-black ${metrics.snr > 35 ? 'text-[#39FF14]' : 'text-amber-500'}`}>
                                                    {safeValue(metrics.snr, ' dB', 1)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[7px] text-slate-500 uppercase mb-1">Status</div>
                                                <div className="text-[9px] font-black text-white uppercase tracking-tighter">
                                                    {metrics.snr > 35 ? "VÁLIDA" : "BAJA PRECISIÓN"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setStatus('IDLE')} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-black uppercase text-[9px] mt-auto">Nueva Medida</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {showGuide && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] p-8 overflow-y-auto flex justify-center">
                    <div className="max-w-xl w-full">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-[#39FF14] uppercase">Protocolo ISO 3382</h3>
                            <button onClick={() => setShowGuide(false)}><Square className="w-5 h-5 rotate-45" /></button>
                        </div>
                        <div className="space-y-6 text-slate-400 text-xs">
                            <p>1. <b>Ruido de Fondo:</b> Debe ser inferior a -35dB del pico.</p>
                            <p>2. <b>Posición:</b> Micrófono a 1.2m de altura, fuente a 1.5m.</p>
                            <p>3. <b>Ponderación:</b> Z (Lineal) para precisión absoluta.</p>
                            <button onClick={() => setShowGuide(false)} className="w-full py-4 bg-[#39FF14] text-black font-black uppercase rounded-xl mt-8">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="mt-8 flex justify-between items-end opacity-30 text-[8px] font-black uppercase tracking-widest">
                <span>Vostok_IR_v2.0</span>
                <span>{SAMPLE_RATE}Hz / 32-bit</span>
            </footer>
        </div>
    );
}
