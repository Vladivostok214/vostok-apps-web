import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Square, Download, Activity, Zap, Info, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- VOSTOK FFT KERNEL (RADIX-2) ---
// Self-contained high-performance FFT for IR Deconvolution
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

export default function ImpulseResponse({ onBack }) {
    const [status, setStatus] = useState('IDLE'); // IDLE, COUNTDOWN, MEASURING, PROCESSING, FINISHED
    const [mode, setMode] = useState('STANDARD'); // FAST, STANDARD, STUDIO
    const [countdown, setCountdown] = useState(3);
    const [progress, setProgress] = useState(0);
    const [irData, setIrData] = useState(null);
    const [freqResponse, setFreqResponse] = useState(null);
    const [rt60, setRt60] = useState(null);
    
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

    const SAMPLE_RATE = 48000;
    const FFT_SIZE = 1048576; // Support up to 10s sweep @ 48kHz (Needs 2^20)

    // Generate Logarithmic Sine Sweep
    const generateSweep = (duration, sr) => {
        const N = Math.floor(duration * sr);
        const buffer = new Float32Array(N);
        const f1 = 20;
        const f2 = 20000;
        for (let i = 0; i < N; i++) {
            const t = i / sr;
            const freq = f1 * Math.pow(f2 / f1, t / duration);
            const phase = 2 * Math.PI * f1 * duration * (Math.pow(f2 / f1, t / duration) - 1) / Math.log(f2 / f1);
            let window = 1.0;
            if (i < 500) window = i / 500;
            if (i > N - 500) window = (N - i) / 500;
            buffer[i] = Math.sin(phase) * window;
        }
        return buffer;
    };

    const startMeasurement = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
            });
            streamRef.current = stream;
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
            
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
            alert("Acceso denegado al hardware.");
        }
    };

    const runSweep = async () => {
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

        recorder.onaudioprocess = (e) => {
            if (!isMeasuringRef.current) return;
            
            const input = e.inputBuffer.getChannelData(0);
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
        // Determine smallest power of 2
        let N = 1;
        while (N < recordedBuffer.current.length) N <<= 1;
        
        const sweep = sweepBuffer.current;
        const recorded = recordedBuffer.current;
        
        const S_re = new Float32Array(N);
        const S_im = new Float32Array(N);
        const R_re = new Float32Array(N);
        const R_im = new Float32Array(N);
        
        S_re.set(sweep);
        R_re.set(recorded.subarray(0, Math.min(recorded.length, N)));
        
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
        
        // Find peak for alignment and normalization
        let peakVal = 0;
        let peakIdx = 0;
        for (let i = 0; i < N; i++) {
            const abs = Math.abs(H_re[i]);
            if (abs > peakVal) {
                peakVal = abs;
                peakIdx = i;
            }
        }

        // Normalize and Shift
        const irResult = new Float32Array(sr * 1.0); // 1s capture
        const startOffset = Math.max(0, peakIdx - Math.floor(sr * 0.01)); // Start 10ms before peak
        for (let i = 0; i < irResult.length; i++) {
            const idx = (startOffset + i) % N;
            irResult[i] = H_re[idx] / peakVal;
        }
        setIrData(irResult);
        
        // Frequency Response with Smoothing
        const freqRes = new Float32Array(N / 2);
        fft(H_re, H_im); // Back to freq domain
        for (let i = 0; i < N / 2; i++) {
            const mag = Math.sqrt(H_re[i] * H_re[i] + H_im[i] * H_im[i]);
            freqRes[i] = 20 * Math.log10(Math.max(mag, 1e-6));
        }

        // 1/12th Octave Smoothing
        const smoothedFreq = new Float32Array(N / 2);
        const octStep = Math.pow(2, 1/12);
        for (let i = 1; i < N / 2; i++) {
            const f = i * sr / N;
            const fLow = f / octStep;
            const fHigh = f * octStep;
            const binLow = Math.max(1, Math.floor(fLow * N / sr));
            const binHigh = Math.min(N/2 - 1, Math.ceil(fHigh * N / sr));
            
            let sum = 0, count = 0;
            for (let b = binLow; b <= binHigh; b++) {
                sum += freqRes[b];
                count++;
            }
            smoothedFreq[i] = sum / count;
        }
        
        setFreqResponse(smoothedFreq);
        
        // --- RT60 Calculation (Schroeder Backward Integration) ---
        const energy = new Float32Array(N);
        for (let i = 0; i < N; i++) energy[i] = H_re[i] * H_re[i];
        
        const schroeder = new Float32Array(N);
        let sum = 0;
        for (let i = N - 1; i >= 0; i--) {
            sum += energy[i];
            schroeder[i] = sum;
        }
        
        // Convert to dB and Normalize
        const schroederDB = new Float32Array(N);
        const maxEnergy = schroeder[0];
        for (let i = 0; i < N; i++) {
            schroederDB[i] = 10 * Math.log10(Math.max(schroeder[i] / maxEnergy, 1e-10));
        }
        
        // Find T20 (-5dB to -25dB)
        let idx5 = -1, idx25 = -1;
        for (let i = 0; i < N; i++) {
            if (idx5 === -1 && schroederDB[i] <= -5) idx5 = i;
            if (idx25 === -1 && schroederDB[i] <= -25) idx25 = i;
        }
        
        if (idx5 !== -1 && idx25 !== -1) {
            const t20 = (idx25 - idx5) / sr;
            setRt60(t20 * 3.0); // Extrapolate to RT60
        } else {
            setRt60(null);
        }

        setStatus('FINISHED');
        setTimeout(() => {
            drawIR(irResult);
            drawFreq(smoothedFreq, N);
        }, 100);
    };

    const drawIR = (data) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        const displayLen = Math.floor(data.length * 0.5); // Show 500ms
        for (let i = 0; i < w; i++) {
            const idx = Math.floor(i * displayLen / w);
            const val = data[idx];
            const x = i;
            const y = h / 2 - val * h / 2.2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    };

    const drawFreq = (data, N) => {
        if (!freqCanvasRef.current) return;
        const canvas = freqCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        
        ctx.clearRect(0, 0, w, h);
        
        // Draw Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (let f of [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]) {
            const x = (Math.log10(f) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * w;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const fMin = 20, fMax = 20000, sr = SAMPLE_RATE;
        let maxDB = -Infinity;
        for (let i = 0; i < w; i++) {
            const freq = fMin * Math.pow(fMax / fMin, i / w);
            const bin = Math.floor(freq * N / sr);
            if (data[bin] > maxDB) maxDB = data[bin];
        }

        for (let i = 0; i < w; i++) {
            const freq = fMin * Math.pow(fMax / fMin, i / w);
            const bin = Math.floor(freq * N / sr);
            const val = data[bin] - maxDB; // Relative to max
            
            const norm = (val + 60) / 60; // -60dB range
            const x = i;
            const y = h - Math.max(0, Math.min(1, norm)) * h;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    };

    const downloadIR = () => {
        if (!irData) return;
        // Simple WAV export
        const buffer = irData;
        const wav = new ArrayBuffer(44 + buffer.length * 2);
        const view = new DataView(wav);
        
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + buffer.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, SAMPLE_RATE, true);
        view.setUint32(28, SAMPLE_RATE * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, buffer.length * 2, true);

        for (let i = 0; i < buffer.length; i++) {
            const s = Math.max(-1, Math.min(1, buffer[i]));
            view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }

        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vostok_impulse_response.wav';
        a.click();
    };

    return (
        <div className="fixed inset-0 bg-[#010101] grid-bg z-[100] p-4 md:p-8 flex flex-col font-sans text-white overflow-hidden crt-scanlines">
            <header className="flex justify-between items-center mb-8 z-20">
                <button onClick={onBack} className="w-12 h-12 bg-white/[0.03] border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all shadow-xl active:scale-95">
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>

                <div className="text-center bg-white/[0.03] border border-white/10 backdrop-blur-md px-10 py-3 rounded-2xl shadow-xl">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#39FF14] flex items-center gap-2">
                        <Activity className="w-4 h-4 animate-pulse" />
                        VOSTOK IR MEASURER
                    </h2>
                    <div className="text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-1">Acústica de Precisión • Sine-Sweep HD</div>
                </div>

                <div className="w-12 h-12" /> {/* Spacer */}
            </header>

            <main className="flex-1 flex flex-col gap-6 relative z-10">
                {status === 'IDLE' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-[#39FF14]/5 border border-[#39FF14]/20 flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 bg-[#39FF14] blur-2xl opacity-10 animate-pulse" />
                            <Zap className="w-10 h-10 text-[#39FF14]" />
                        </div>
                        <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase">Captura de Respuesta</h3>
                        <p className="text-slate-400 max-w-md mb-8 text-sm leading-relaxed">
                            Mide la huella acústica de tu sala o equipo usando un barrido logarítmico. 
                            Asegúrate de tener silencio y volumen adecuado.
                        </p>
                        
                        <div className="flex gap-3 mb-10">
                            {Object.entries(MODES).map(([k, m]) => (
                                <button 
                                    key={k}
                                    onClick={() => setMode(k)}
                                    className={`px-6 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${mode === k ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={startMeasurement}
                            className="px-12 py-5 bg-[#39FF14] text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-[0_0_30px_rgba(57,255,20,0.3)]"
                        >
                            Iniciar Secuencia
                        </button>
                    </div>
                )}

                {status === 'COUNTDOWN' && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-[12rem] font-black text-[#39FF14] animate-ping">
                            {countdown}
                        </div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mt-8">Prepárate para el barrido</span>
                    </div>
                )}

                {(status === 'MEASURING' || status === 'PROCESSING') && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-64 h-64 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                                <circle 
                                    cx="50" cy="50" r="48" 
                                    fill="none" 
                                    stroke="#39FF14" 
                                    strokeWidth="4" 
                                    strokeDasharray="301.6" 
                                    strokeDashoffset={301.6 * (1 - progress)}
                                    className="transition-all duration-300"
                                />
                            </svg>
                            <div className="text-center">
                                <span className="text-4xl font-black font-mono">
                                    {status === 'MEASURING' ? Math.round(progress * 100) : "..."}
                                    <span className="text-xs text-[#39FF14] ml-1">%</span>
                                </span>
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">
                                    {status === 'MEASURING' ? "CAPTURANDO SEÑAL" : "DECONVOLUCIÓN FFT"}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'FINISHED' && (
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                            {/* Time Domain IR */}
                            <div className="bg-black/40 border border-white/10 rounded-[2rem] p-8 flex flex-col shadow-2xl overflow-hidden relative group">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-[0.3em]">Impulse Response (1s)</span>
                                    <div className="flex items-center gap-3">
                                        {rt60 && (
                                            <div className="px-3 py-1 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-lg">
                                                <span className="text-[9px] font-mono text-[#39FF14] font-black">RT60: {rt60.toFixed(2)}s</span>
                                            </div>
                                        )}
                                        <Info className="w-4 h-4 text-slate-600" />
                                    </div>
                                </div>
                                <canvas ref={canvasRef} className="flex-1 w-full" />
                                <div className="absolute inset-0 pointer-events-none border-x border-white/5 m-8" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '100% 20px' }} />
                            </div>

                            {/* Freq Domain Response */}
                            <div className="bg-black/40 border border-white/10 rounded-[2rem] p-8 flex flex-col shadow-2xl overflow-hidden relative group">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Frequency Response (20Hz-20kHz)</span>
                                    <Info className="w-4 h-4 text-slate-600" />
                                </div>
                                <canvas ref={freqCanvasRef} className="flex-1 w-full" />
                                <div className="absolute inset-0 pointer-events-none border-x border-white/5 m-8" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '10% 100%' }} />
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center py-4">
                            <button 
                                onClick={() => setStatus('IDLE')}
                                className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Nueva Medida
                            </button>
                            <button 
                                onClick={downloadIR}
                                className="px-10 py-4 bg-[#39FF14] text-black rounded-2xl flex items-center gap-3 hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(57,255,20,0.2)]"
                            >
                                <Download className="w-4 h-4" />
                                Exportar .WAV
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer Telemetry */}
            <footer className="mt-8 flex justify-between items-end opacity-40">
                <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em]">Engine</span>
                    <span className="text-[9px] font-mono text-white">Vostok_Deconv_v1.0</span>
                </div>
                <div className="h-[1px] flex-1 mx-8 bg-white/5 mb-2" />
                <div className="flex flex-col gap-1 text-right">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em]">Precision</span>
                    <span className="text-[9px] font-mono text-white">32-Bit Float / {SAMPLE_RATE}Hz</span>
                </div>
            </footer>
        </div>
    );
}
