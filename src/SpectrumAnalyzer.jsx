import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pause, Play, Mic, Maximize2, Minimize2 } from 'lucide-react';
import { useAudioDevice, routeAudioChannel } from './context/AudioDeviceContext';

export default function SpectrumAnalyzer({ onBack }) {
  const { selectedDeviceId, selectedChannel } = useAudioDevice();
  const [isRunning, setIsRunning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowMode, setWindowMode] = useState('BLACKMAN');
  const [peakFreq, setPeakFreq] = useState("----");
  const [peakMag, setPeakMag] = useState("--.-");

  const canvasRef = useRef(null);
  const waterfallCanvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const animationRef = useRef(null);
  const dataArray = useRef(null);
  const smoothedData = useRef(null);
  const windowBuffer = useRef(null); // Buffer for manual windowing if needed
  const frameCounterRef = useRef(0);
  const hoverRef = useRef({ active: false, x: 0, freq: 0, db: 0 });

  // WebGL Resources
  const glRef = useRef(null);
  const programRef = useRef(null);
  const textureRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const resize = useCallback(() => {
    if (!canvasRef.current || !waterfallCanvasRef.current) return;
    const canvas = canvasRef.current;
    const wCanvas = waterfallCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    
    const wParent = wCanvas.parentElement;
    wCanvas.width = wParent.clientWidth * dpr;
    wCanvas.height = wParent.clientHeight * dpr;

    if (glRef.current) {
        glRef.current.viewport(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;
    glRef.current = gl;

    const vsSource = `
      attribute vec2 position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform sampler2D u_audioData;
      uniform vec2 u_resolution;
      uniform float u_hoverX;
      uniform float u_sampleRate;
      
      void main() {
        vec2 uv = v_texCoord;
        float x = uv.x;
        
        // --- VOSTOK HD-LOG MAPPING (20Hz - 20kHz) ---
        float fmin = 20.0;
        float fmax = 20000.0;
        float freq = fmin * pow(fmax / fmin, x);
        float u = 2.0 * freq / u_sampleRate;
        
        // Smooth sampling with texture interpolation
        float amp = texture2D(u_audioData, vec2(u, 0.5)).r;
        
        // --- VOSTOK SPECTRAL TILT (Slope Compensation) ---
        float tilt = pow(freq / 100.0, 0.22); // Reduced tilt slightly
        amp *= tilt;
        
        // Dynamic Range (Compressed for better visibility)
        // Reduced global gain to provide headroom
        amp = clamp(pow(amp * 0.65, 0.85), 0.0, 1.0); 
        
        // --- NOIR-TECH LOGARITHMIC GRID ---
        float grid = 0.0;
        float markers[10];
        markers[0] = 20.0; markers[1] = 50.0; markers[2] = 100.0; markers[3] = 200.0; 
        markers[4] = 500.0; markers[5] = 1000.0; markers[6] = 2000.0; markers[7] = 5000.0; 
        markers[8] = 10000.0; markers[9] = 20000.0;
        
        for(int i = 0; i < 10; i++) {
            float markerX = log(markers[i] / fmin) / log(fmax / fmin);
            float dist = abs(x - markerX) * u_resolution.x;
            grid += 0.12 * exp(-0.15 * dist * dist); // Refined glow
        }
        
        // Horizontal magnitude grid
        if (mod(uv.y * 6.0, 1.0) < 0.01) grid += 0.03;

        // --- SPECTRUM RENDER ---
        // Changed 0.85 to 0.70 to ensure 25% headroom at the top
        float mask = step(uv.y, amp * 0.70 + 0.05);
        
        // Refined Vostok Gradient (Cyan to Vostok Green)
        vec3 color = mix(vec3(0.0, 0.4, 0.6), vec3(0.22, 1.0, 0.08), amp);
        
        // Subtle CRT Scanline
        float scanline = sin(uv.y * u_resolution.y * 0.8) * 0.03;
        
        // Organic Laser Trace (Softer)
        float edge = exp(-80.0 * abs(uv.y - (amp * 0.70 + 0.05)));
        vec3 laserColor = vec3(0.3, 1.0, 0.2) * edge;

        // Subtle Hover Crosshair (Gaussian)
        float crosshair = exp(-0.08 * abs(uv.x - u_hoverX) * u_resolution.x) * 0.2;

        vec3 finalColor = (color - scanline + grid + laserColor + crosshair) * mask + (vec3(grid + crosshair) * (1.0-mask));
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
          return null;
      }
      return shader;
    };

    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    programRef.current = program;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posAttrib = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textureRef.current = texture;
    
    resize();
  }, [resize]);

  const draw = useCallback(() => {
    const loop = () => {
      if (isFrozen || !analyser.current || !glRef.current) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      const gl = glRef.current;
      const program = programRef.current;
      const texture = textureRef.current;

      analyser.current.getByteFrequencyData(dataArray.current);

      if (!smoothedData.current) {
        smoothedData.current = new Float32Array(dataArray.current.length);
      }

      // --- VOSTOK ANALOG BALLISTICS: ATTACK & RELEASE ---
      const attack = 0.85; // Faster rise
      const release = 0.12; // Slower fall for musicality
      
      for (let i = 0; i < dataArray.current.length; i++) {
        const target = dataArray.current[i];
        const current = smoothedData.current[i];
        const factor = target > current ? attack : release;
        smoothedData.current[i] += (target - current) * factor;
      }

      // --- VOSTOK PEAK DETECTION ---
      let maxRawVal = -1;
      let peakIdx = -1;
      const sr = audioCtx.current.sampleRate;
      const N = analyser.current.fftSize;
      const minBin = Math.floor(20 * N / sr); 

      for (let i = minBin; i < smoothedData.current.length; i++) {
        if (smoothedData.current[i] > maxRawVal) {
          maxRawVal = smoothedData.current[i];
          peakIdx = i;
        }
      }

      if (maxRawVal > 20 && peakIdx > 0 && peakIdx < smoothedData.current.length - 1) {
        frameCounterRef.current++;
        if (frameCounterRef.current % 3 === 0) {
           // Parabolic Interpolation
           const y0 = smoothedData.current[peakIdx - 1];
           const y1 = smoothedData.current[peakIdx];
           const y2 = smoothedData.current[peakIdx + 1];
           const offset = (y2 - y0) / (2 * (2 * y1 - y2 - y0) || 1);
           const accurateFreq = ((peakIdx + offset) * sr) / N;
           
           setPeakFreq(Math.round(accurateFreq));
           
           // dBFS Calculation
           const dbRange = analyser.current.maxDecibels - analyser.current.minDecibels;
           const dbfs = analyser.current.minDecibels + (maxRawVal / 255) * dbRange;
           setPeakMag(dbfs.toFixed(1));
        }
      } else if (maxRawVal <= 20) {
          setPeakFreq("----");
          setPeakMag("--.-");
      }

      gl.useProgram(program);
      
      const resLoc = gl.getUniformLocation(program, 'u_resolution');
      gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);
      
      const sampleRateLoc = gl.getUniformLocation(program, 'u_sampleRate');
      gl.uniform1f(sampleRateLoc, audioCtx.current.sampleRate);
      
      const hoverLoc = gl.getUniformLocation(program, 'u_hoverX');
      const dpr = window.devicePixelRatio || 1;
      const canvasWidth = gl.canvas.width / dpr;
      gl.uniform1f(hoverLoc, hoverRef.current.active ? hoverRef.current.x / canvasWidth : -1.0);

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, smoothedData.current.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array(smoothedData.current));
      
      gl.clearColor(0.005, 0.005, 0.005, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Waterfall Render
      const wCanvas = waterfallCanvasRef.current;
      const wCtx = wCanvas.getContext('2d', { alpha: false });
      wCtx.drawImage(wCanvas, 0, 0, wCanvas.width, wCanvas.height - 1, 0, 1, wCanvas.width, wCanvas.height - 1);
      const row = wCtx.createImageData(wCanvas.width, 1);
      const fmin = 20.0;
      const fmax = 20000.0;
      const sr_val = audioCtx.current.sampleRate;
      const N_val = analyser.current.fftSize;
      
      let clipCounter = 0;

      for (let i = 0; i < wCanvas.width; i++) {
          const x = i / wCanvas.width;
          const freq = fmin * Math.pow(fmax / fmin, x);
          const binIdxFloat = freq * N_val / sr_val;
          const binIdx = binIdxFloat | 0; // Bitwise trunc
          const v0 = smoothedData.current[Math.min(binIdx, dataArray.current.length - 1)];
          
          if (v0 >= 250) {
            clipCounter++;
          }

          let norm = v0 * 0.00392156862; // 1/255
          let contrastVal = Math.pow(norm, 1.4); 

          const idx = i << 2; // i * 4
          let r, g, b;
          if (contrastVal < 0.4) {
            const t = contrastVal / 0.4;
            r = 0; g = t * 80; b = 40 + t * 120;
          } else if (contrastVal < 0.8) {
            const t = (contrastVal - 0.4) / 0.4;
            r = t * 60; g = 80 + t * 175; b = 160 - t * 160;
          } else {
            const t = (contrastVal - 0.8) / 0.2;
            r = 60 + t * 195; g = 255; b = t * 255;
          }

          row.data[idx] = r;
          row.data[idx+1] = g;
          row.data[idx+2] = b;
          row.data[idx+3] = 255;
      }
      wCtx.putImageData(row, 0, 0);

      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [isFrozen]);

  const stopEngine = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (audioCtx.current) {
      if (audioCtx.current.state !== 'closed') {
        audioCtx.current.close().then(() => {
          console.log('[Vostok Spectrum] AudioContext Closed');
        });
      }
      audioCtx.current = null;
    }
    setIsRunning(false);
  }, []);

  const startEngine = async () => {
    try {
      const constraints = { 
        audio: { 
          echoCancellation: false, 
          noiseSuppression: false, 
          autoGainControl: false,
          ...(selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {})
        } 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive'
      });
      
      const hp = audioCtx.current.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 20;
      hp.Q.value = 0.7;

      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 4096; 
      analyser.current.minDecibels = -90;
      analyser.current.maxDecibels = 0;

      const source = audioCtx.current.createMediaStreamSource(stream);
      const routedSource = routeAudioChannel(audioCtx.current, source, selectedChannel);
      routedSource.connect(hp);
      hp.connect(analyser.current);

      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
      
      initWebGL();
      setIsRunning(true);
      draw();
      
      analyser.current.mediaStream = stream;
    } catch (e) {
      console.error(e);
      alert("Acceso denegado al hardware.");
    }
  };

  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => {
      console.log('[Vostok System] Unmounting Spectrum - Cleaning up...');
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (analyser.current?.mediaStream) {
        analyser.current.mediaStream.getTracks().forEach(t => t.stop());
      }
      if (audioCtx.current && audioCtx.current.state !== 'closed') {
        audioCtx.current.close();
      }
    };
  }, [resize]);

  const freqMarkers = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

  const [hoverData, setHoverData] = useState({ active: false, x: 0, y: 0, freq: 0, db: 0 });

  const handleMouseMove = (e) => {
    if (!canvasRef.current || !analyser.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = rect.width;
    const fmin = 20.0;
    const fmax = 20000.0;
    
    const freq = fmin * Math.pow(fmax / fmin, x / width);
    
    const N = analyser.current.fftSize;
    const sr = audioCtx.current?.sampleRate || 44100;
    const binIdxFloat = freq * N / sr;
    const binIdx = Math.floor(binIdxFloat);
    
    let db = -90;
    if (smoothedData.current) {
        const v0 = smoothedData.current[Math.min(binIdx, smoothedData.current.length - 1)];
        const dbRange = analyser.current.maxDecibels - analyser.current.minDecibels;
        db = analyser.current.minDecibels + (v0 / 255) * dbRange;
    }

    hoverRef.current = { active: true, x };
    setHoverData({ active: true, x: e.clientX, y: e.clientY, freq, db });
  };

  const handleMouseLeave = () => {
    hoverRef.current.active = false;
    setHoverData(prev => ({ ...prev, active: false }));
  };

  return (
    <div className="fixed inset-0 bg-[#010101] grid-bg z-[100] p-4 md:p-6 flex flex-col font-sans text-white overflow-hidden crt-scanlines">
      {hoverData.active && (
        <div 
            className="fixed z-[200] pointer-events-none transition-all duration-75 ease-out"
            style={{ left: hoverData.x + 20, top: hoverData.y - 40 }}
        >
            <div className="bg-black/90 border border-[#39FF14]/40 backdrop-blur-xl px-3 py-2 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Freq</span>
                    <span className="font-mono text-xs font-black text-[#39FF14]">
                        {hoverData.freq >= 1000 ? (hoverData.freq/1000).toFixed(2) + 'k' : Math.round(hoverData.freq)} 
                        <span className="text-[8px] ml-0.5 opacity-70">Hz</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Mag</span>
                    <span className="font-mono text-xs font-black text-white">
                        {hoverData.db.toFixed(1)}
                        <span className="text-[8px] ml-0.5 opacity-50">dB</span>
                    </span>
                </div>
            </div>
            <div className="absolute -left-[20px] top-[40px] w-2 h-2 -translate-x-1/2 -translate-y-1/2 border border-[#39FF14] rounded-full shadow-[0_0_10px_#39FF14]"></div>
        </div>
      )}

      <header className="flex justify-between items-center mb-6 z-20 relative">
        <div className="flex gap-3">
            <button onClick={onBack} className="w-12 h-12 bg-white/[0.03] border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all shadow-xl active:scale-95">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <button onClick={toggleFullscreen} className="w-12 h-12 bg-white/[0.03] border border-white/10 backdrop-blur-md rounded-2xl hidden md:flex items-center justify-center hover:bg-white/10 transition-all shadow-xl active:scale-95">
                {isFullscreen ? <Minimize2 className="w-5 h-5 text-slate-400" /> : <Maximize2 className="w-5 h-5 text-slate-400" />}
            </button>
        </div>

        <div className="text-center bg-white/[0.03] border border-white/10 backdrop-blur-md px-8 md:px-12 py-3 rounded-2xl shadow-xl flex flex-col items-center">
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#39FF14] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]"></div>
                VOSTOK SPECTRUM HD
            </h2>
            <div className="text-[7px] md:text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-1">Escala Logarítmica • {windowMode} Window</div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setWindowMode(prev => prev === 'HANN' ? 'BLACKMAN' : 'HANN')} 
            className={`px-4 h-12 border backdrop-blur-md rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 group ${windowMode === 'BLACKMAN' ? 'border-[#39FF14]/40 bg-[#39FF14]/10 shadow-[0_0_15px_rgba(57,255,20,0.1)]' : 'bg-white/[0.03] border-white/10'}`}
          >
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Filter</span>
              <span className={`text-[10px] font-mono font-black tracking-widest uppercase ${windowMode === 'BLACKMAN' ? 'text-[#39FF14] drop-shadow-[0_0_5px_#39FF14]' : 'text-slate-400'}`}>
                {windowMode}
              </span>
          </button>
          <button onClick={() => setIsFrozen(!isFrozen)} className={`w-12 h-12 ${isFrozen ? 'border-[#39FF14] bg-[#39FF14]/10' : 'bg-white/[0.03] border-white/10'} border backdrop-blur-md rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95`}>
              {isFrozen ? <Play className="w-5 h-5 text-[#39FF14]" /> : <Pause className="w-5 h-5 text-white" />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-5 relative z-10 min-h-0">
        <div className="flex-[3] relative bg-black/40 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl group">
            <canvas 
                ref={canvasRef} 
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="w-full h-full cursor-none md:cursor-crosshair" 
            />
            
            <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-white/5 bg-black/60 backdrop-blur-md flex items-center px-4 pointer-events-none">
                <div className="relative w-full h-full">
                    {freqMarkers.map(f => {
                        const x = (Math.log(f / 20) / Math.log(20000 / 20)) * 100;
                        return (
                            <span key={f} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[7px] font-black text-slate-600 uppercase tracking-tighter" style={{ left: `${x}%` }}>
                                {f >= 1000 ? `${f/1000}k` : f}
                            </span>
                        );
                    })}
                </div>
            </div>

            <div className="absolute top-6 left-8 flex gap-4 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl transition-all">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-1">Peak Freq</span>
                    <div className="font-mono text-2xl md:text-3xl font-black text-white leading-none flex items-baseline gap-1">
                        {peakFreq}
                        <span className="text-[10px] text-[#39FF14]">Hz</span>
                    </div>
                </div>
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl transition-all">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-1">Nivel</span>
                    <div className="font-mono text-xl md:text-2xl font-black text-white leading-none flex items-baseline gap-1">
                        {peakMag}
                        <span className="text-[10px] text-slate-400">dBFS</span>
                    </div>
                </div>
            </div>

            {!isRunning && (
                <div onClick={startEngine} className="absolute inset-0 bg-[#010101]/90 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer z-50">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#39FF14] blur-[40px] opacity-20 animate-pulse"></div>
                        <Mic className="w-16 h-16 text-[#39FF14] mb-4 relative z-10" />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.6em] text-[#39FF14] uppercase mt-4">INICIAR MOTOR WEBGL</span>
                </div>
            )}
        </div>

        <div className="flex-1 md:h-40 relative bg-black/40 border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl">
            <canvas ref={waterfallCanvasRef} className="w-full h-full" />
            <div className="absolute top-4 left-6 z-30 flex items-center gap-3 bg-black/60 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md shadow-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan] animate-pulse"></div>
                <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Topografía Sónica</span>
            </div>
        </div>
      </main>
    </div>
  );
}
