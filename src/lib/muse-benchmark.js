// src/lib/muse-benchmark.js

// Importamos la función central aislada para testing
const MAX_BUFFER_SIZE = 2048;
const correlationBuffer = new Float32Array(MAX_BUFFER_SIZE);

const autoCorrelateTest = (buf, sampleRate) => {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buf[i]) < thres) { r1 = i; break; } }
  for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; } }
  
  const activeBuf = buf.subarray(r1, r2);
  const activeSize = activeBuf.length;
  
  correlationBuffer.fill(0);
  
  for (let i = 0; i < activeSize; i++) {
    for (let j = 0; j < activeSize - i; j++) {
      correlationBuffer[i] += activeBuf[j] * activeBuf[j + i];
    }
  }

  let d = 0; while (correlationBuffer[d] > correlationBuffer[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < activeSize; i++) {
    if (correlationBuffer[i] > maxval) {
      maxval = correlationBuffer[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  if (T0 <= 0 || T0 >= activeSize - 1) return -1;
  
  const x1 = correlationBuffer[T0 - 1], x2 = correlationBuffer[T0], x3 = correlationBuffer[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  
  return sampleRate / T0;
};

// Generadores de Señal Sintética
const generateSineWave = (freq, sampleRate, length) => {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = Math.sin((i * 2 * Math.PI * freq) / sampleRate);
  }
  return buffer;
};

const addNoise = (buffer, noiseLevel) => {
  const noisyBuffer = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    noisyBuffer[i] = buffer[i] + (Math.random() * 2 - 1) * noiseLevel;
  }
  return noisyBuffer;
};

// Ejecución del Benchmark
export const runMuseBenchmark = () => {
  console.log("%c[VOSTOK LABS] Iniciando Benchmark MUSE...", "color: #39FF14; font-weight: bold; background: #050505; padding: 4px;");
  
  const sampleRate = 44100;
  const bufferSize = 2048;
  const testIterations = 1000; // Simulación de carga sostenida
  
  const tests = [
    { name: "Tono Puro (440Hz)", freq: 440, noise: 0 },
    { name: "Tono Grave (82.4Hz - E2)", freq: 82.41, noise: 0 },
    { name: "Interferencia Leve (440Hz + 20% Ruido)", freq: 440, noise: 0.2 },
    { name: "Alta Reverberación/Ruido (440Hz + 80% Ruido)", freq: 440, noise: 0.8 },
  ];

  console.table(tests.map(t => ({
    "Escenario de Prueba": t.name,
    "Frecuencia Objetivo (Hz)": t.freq,
    "Nivel de Ruido": `${t.noise * 100}%`
  })));

  tests.forEach(test => {
    const baseSignal = generateSineWave(test.freq, sampleRate, bufferSize);
    const testSignal = addNoise(baseSignal, test.noise);
    
    let totalTime = 0;
    let detectedFreq = 0;
    let successCount = 0;

    // Calentamiento del JIT compiler
    for (let i = 0; i < 50; i++) autoCorrelateTest(testSignal, sampleRate);

    // Medición exacta
    for (let i = 0; i < testIterations; i++) {
      const start = performance.now();
      const result = autoCorrelateTest(testSignal, sampleRate);
      const end = performance.now();
      
      totalTime += (end - start);
      if (result !== -1) {
        detectedFreq = result;
        successCount++;
      }
    }

    const avgTime = totalTime / testIterations;
    const errorMargin = Math.abs(detectedFreq - test.freq);
    const accuracy = successCount / testIterations;

    console.log(`%cResultados: ${test.name}`, "color: #00d1ff; font-weight: bold;");
    console.log(`⏱️ Latencia Promedio: ${avgTime.toFixed(4)} ms / frame`);
    console.log(`🎯 Frecuencia Detectada: ${detectedFreq.toFixed(2)} Hz (Error: ${errorMargin.toFixed(2)} Hz)`);
    console.log(`📊 Tasa de Éxito de Correlación: ${(accuracy * 100).toFixed(1)}%\n---`);
  });

  console.log("%c[VOSTOK LABS] Benchmark MUSE Completado.", "color: #39FF14; font-weight: bold; background: #050505; padding: 4px;");
};