import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pause, Play, Mic } from 'lucide-react';

export default function SpectrumAnalyzer({ onBack }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [peakFreq, setPeakFreq] = useState("----");

  const canvasRef = useRef(null);
  const waterfallCanvasRef = useRef(null);
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const animationRef = useRef(null);
  const dataArray = useRef(null);
  const frameCounterRef = useRef(0);
  const hoverRef = useRef({ active: false, x: 0, freq: 0, db: 0 });

  // WebGL Resources
  const glRef = useRef(null);
  const programRef = useRef(null);
  const textureRef = useRef(null);

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
      
      void main() {
        vec2 uv = v_texCoord;
        float x = uv.x;
        
        // --- HD LOGARITHMIC MAPPING (20Hz - 20kHz) ---
        // Aligns with musical perception and Vostok HD-RTA standards
        float logX = log2(1.0 + x * 63.0) / 6.0; 
        float amp = texture2D(u_audioData, vec2(logX, 0.5)).r;
        
        // --- NOIR-TECH GRID SYSTEM ---
        float grid = 0.0;
        // Vertical lines (frequency markers)
        if (mod(uv.x * u_resolution.x, u_resolution.x / 10.0) < 1.0) grid += 0.05;
        // Horizontal lines (dB markers)
        if (mod(uv.y * u_resolution.y, u_resolution.y / 5.0) < 1.0) grid += 0.05;

        // --- SPECTRUM RENDER ---
        float mask = step(uv.y, amp * 0.85 + 0.05);
        
        // Vostok Neon Gradient
        vec3 color = mix(vec3(0.01, 0.4, 0.5), vec3(0.22, 1.0, 0.08), amp);
        
        // CRT Scanline
        float scanline = sin(uv.y * u_resolution.y * 0.5) * 0.04;
        
        // Laser Trace (Top edge of the spectrum)
        float edge = smoothstep(0.01, 0.0, abs(uv.y - (amp * 0.85 + 0.05)));
        vec3 laserColor = vec3(0.2, 1.0, 0.0) * edge;

        // Hover Crosshair
        float crosshair = step(abs(uv.x - u_hoverX), 0.001) * 0.2;

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

      // --- Peak Detection Logic ---
      let maxVal = -1;
      let maxIdx = -1;
      for (let i = 0; i < dataArray.current.length; i++) {
        if (dataArray.current[i] > maxVal) {
          maxVal = dataArray.current[i];
          maxIdx = i;
        }
      }
      if (maxVal > 50) {
        frameCounterRef.current++;
        if (frameCounterRef.current % 10 === 0) {
           const freq = (maxIdx * audioCtx.current.sampleRate) / analyser.current.fftSize;
           setPeakFreq(Math.round(freq));
        }
      }

      gl.useProgram(program);
      
      const resLoc = gl.getUniformLocation(program, 'u_resolution');
      gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);
      
      const hoverLoc = gl.getUniformLocation(program, 'u_hoverX');
      gl.uniform1f(hoverLoc, hoverRef.current.active ? hoverRef.current.x / (gl.canvas.width / (window.devicePixelRatio || 1)) : -1.0);

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, dataArray.current.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, dataArray.current);
      
      gl.clearColor(0.01, 0.01, 0.01, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Waterfall Render (Optimized Canvas2D Layer)
      const wCanvas = waterfallCanvasRef.current;
      const wCtx = wCanvas.getContext('2d', { alpha: false });
      wCtx.drawImage(wCanvas, 0, 0, wCanvas.width, wCanvas.height - 1, 0, 1, wCanvas.width, wCanvas.height - 1);
      const row = wCtx.createImageData(wCanvas.width, 1);
      for (let i = 0; i < wCanvas.width; i++) {
          const val = dataArray.current[Math.floor((i / wCanvas.width) * dataArray.current.length)];
          const idx = i * 4;
          row.data[idx] = val * 0.1; 
          row.data[idx+1] = val;     
          row.data[idx+2] = 255 - val; 
          row.data[idx+3] = 255;
      }
      wCtx.putImageData(row, 0, 0);

      animationRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [isFrozen]);

  const startEngine = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
      });
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 2048; 

      const source = audioCtx.current.createMediaStreamSource(stream);
      source.connect(analyser.current);

      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
      
      initWebGL();
      setIsRunning(true);
      draw();
    } catch (e) {
      console.error(e);
      alert("Acceso denegado al hardware.");
    }
  };

  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
      if (audioCtx.current) audioCtx.current.close();
    };
  }, [resize]);

  return (
    <div className="fixed inset-0 bg-[#010101] z-[100] p-6 flex flex-col font-sans text-white overflow-hidden">
      <header className="flex justify-between items-center mb-6 z-20 relative">
        <button onClick={onBack} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all shadow-2xl">
            <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center bg-white/5 border border-white/10 px-10 py-3 rounded-3xl">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#39FF14]">VOSTOK SPECTRUM HD</h2>
            <div className="text-[7px] font-bold text-slate-500 tracking-widest uppercase mt-1">Noir-Tech WebGL Accelerator</div>
        </div>
        <button onClick={() => setIsFrozen(!isFrozen)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
            {isFrozen ? <Play className="w-5 h-5 text-[#39FF14]" /> : <Pause className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-5 relative z-10">
        <div className="flex-[3] relative bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <canvas 
                ref={canvasRef} 
                onMouseMove={(e) => {
                    const rect = canvasRef.current.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    hoverRef.current = { active: true, x };
                }}
                onMouseLeave={() => { hoverRef.current.active = false; }}
                className="w-full h-full cursor-crosshair" 
            />
            
            {/* Peak Telemetry Overlay */}
            <div className="absolute top-6 left-8 bg-black/40 backdrop-blur-xl border border-white/5 px-6 py-3 rounded-2xl shadow-xl z-30 pointer-events-none">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-1">Peak Freq</span>
                <div className="font-mono text-3xl font-black text-white">{peakFreq}<span className="text-xs ml-1 text-[#39FF14]">Hz</span></div>
            </div>

            {!isRunning && (
                <div onClick={startEngine} className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center cursor-pointer z-50">
                    <Mic className="w-16 h-16 text-[#39FF14] mb-4 animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.6em] text-[#39FF14] uppercase">INICIAR MOTOR WEBGL</span>
                </div>
            )}
        </div>
        <div className="h-40 relative bg-white/5 border border-white/10 rounded-[1.5rem] overflow-hidden">
            <canvas ref={waterfallCanvasRef} className="w-full h-full" />
            <div className="absolute top-3 left-6 z-30 flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_cyan]"></div>
                <span className="text-[8px] font-black text-white uppercase tracking-[0.3em] opacity-60">TOPOGRAFÍA SÓNICA</span>
            </div>
        </div>
      </main>
    </div>
  );
}
