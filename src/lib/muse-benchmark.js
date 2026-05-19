// src/lib/muse-benchmark.js
import { autoCorrelate, calculateHPS, extractChroma } from './vostok-dsp-core';

// --- UTILS PARA GENERACIÓN DE SEÑAL ---
const generateSineWave = (freq, sampleRate, length) => {
  const buffer = new Float32Array(length);
  const step = (2 * Math.PI * freq) / sampleRate;
  for (let i = 0; i < length; i++) buffer[i] = Math.sin(i * step);
  return buffer;
};

const addNoise = (buffer, noiseLevel) => {
  const noisy = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) noisy[i] = buffer[i] + (Math.random() * 2 - 1) * noiseLevel;
  return noisy;
};

const printHeader = (tool) => {
    console.log(`%c[VOSTOK STRESS TEST] Tool: ${tool.toUpperCase()}`, "color: #39FF14; font-weight: bold; background: #050505; padding: 6px; border: 1px solid #39FF14;");
};

// --- BENCHMARK: TUNER ---
export const benchmarkTuner = () => {
  printHeader('Tuner (YIN Engine)');
  const sampleRate = 22050, bufferSize = 4096, iterations = 500;
  const tests = [
    { name: "Guitar High E (329.63Hz)", freq: 329.63, noise: 0.1 },
    { name: "Bass Low E (41.2Hz)", freq: 41.2, noise: 0.2, isBass: true }
  ];

  tests.forEach(t => {
    const signal = addNoise(generateSineWave(t.freq, sampleRate, bufferSize), t.noise);
    let total = 0, lastResult = 0;
    
    // Warmup
    for(let i=0; i<20; i++) autoCorrelate(signal, sampleRate, t.isBass);
    
    for(let i=0; i<iterations; i++) {
        const s = performance.now();
        lastResult = autoCorrelate(signal, sampleRate, t.isBass);
        total += (performance.now() - s);
    }
    console.log(`%c${t.name} -> Avg: ${(total/iterations).toFixed(4)}ms | Detected: ${lastResult.toFixed(2)}Hz`, "color: #00d1ff;");
  });
};

// --- BENCHMARK: TEMPOSENSE (HPS + CHROMA) ---
export const benchmarkTempoSense = () => {
  printHeader('TempoSense (HPS Engine)');
  const fftSize = 8192, sampleRate = 44100, iterations = 200;
  
  // Simulación de datos de frecuencia (dBFS)
  const freqData = new Float32Array(fftSize / 2).fill(-60);
  // Inyectar armónicos de A4 (440Hz)
  const bin = Math.round(440 * fftSize / sampleRate);
  freqData[bin] = -10; freqData[bin*2] = -15; freqData[bin*3] = -20;

  let totalHPS = 0, totalChroma = 0;
  
  for(let i=0; i<iterations; i++) {
      const s1 = performance.now();
      const hps = calculateHPS(freqData, freqData.length);
      totalHPS += (performance.now() - s1);
      
      const s2 = performance.now();
      extractChroma(hps, sampleRate, fftSize);
      totalChroma += (performance.now() - s2);
  }
  
  console.log(`%cHPS Average: ${(totalHPS/iterations).toFixed(4)}ms`, "color: #A855F7;");
  console.log(`%cChroma Average: ${(totalChroma/iterations).toFixed(4)}ms`, "color: #fbbf24;");
};

// --- BENCHMARK: SPECTRUM (WEBGL/WATERFALL) ---
export const benchmarkSpectrum = () => {
    printHeader('Spectrum (Waterfall Logic)');
    const width = 1024, iterations = 500;
    const mockData = new Float32Array(2048).fill(128);
    
    let total = 0;
    for(let i=0; i<iterations; i++) {
        const s = performance.now();
        // Simulación del bucle bitwise de waterfall
        for (let j = 0; j < width; j++) {
            const idx = j << 2;
            const v = mockData[j & 2047] | 0;
            // mock logic
            const r = v * 0.5 | 0;
        }
        total += (performance.now() - s);
    }
    console.log(`%cWaterfall Logic Avg: ${(total/iterations).toFixed(4)}ms`, "color: #39FF14;");
};

export const runMuseBenchmark = (view = 'home') => {
    switch(view) {
        case 'tuner': benchmarkTuner(); break;
        case 'tempo': benchmarkTempoSense(); break;
        case 'spectrum': benchmarkSpectrum(); break;
        default: 
            console.warn("Navega a una herramienta específica para un Benchmark de estrés especializado.");
            benchmarkTuner(); // Default to tuner as general test
    }
};
