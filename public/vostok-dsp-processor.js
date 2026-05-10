/**
 * VOSTOK LABS - DSP PROCESSOR KERNEL
 * High-performance audio processing for SPL and Tuner modules.
 */

class VostokDSPProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // SPL A-Weighting Filter States (3x Biquad SOS @ 48kHz)
    this.splStages = [
      { b: [0.34290801, -0.68581602, 0.34290801], a: [1.0, -1.86650466, 0.87063426] },
      { b: [1.0, 2.0, 1.0], a: [1.0, -0.27092825, 0.01831859] },
      { b: [1.0, -2.0, 1.0], a: [1.0, -1.97405104, 0.97407073] }
    ];
    this.splW = [new Float32Array(2), new Float32Array(2), new Float32Array(2)];
    this.rmsSum = 0;
    this.sampleCount = 0;
    this.currentWeighting = 'A';
    this.currentResponse = 'FAST'; // FAST o SLOW
    this.calibrationOffset = 117.4; // Valor base

    // Balística Exponencial (Fast: 125ms, Slow: 1000ms)
    // Coeficiente k = 1 - exp(-T / tau) donde T es el tiempo de bloque (approx 2.6ms @ 128 samples)
    this.fastK = 1 - Math.exp(-0.0026 / 0.125);
    this.slowK = 1 - Math.exp(-0.0026 / 1.0);
    this.lpFiltered = 0;

    this.port.onmessage = (e) => {
      if (e.data.type === 'SET_WEIGHTING') this.currentWeighting = e.data.value;
      if (e.data.type === 'SET_RESPONSE') this.currentResponse = e.data.value;
      if (e.data.type === 'SET_CALIBRATION') this.calibrationOffset = e.data.value;
      
      if (e.data.type === 'SET_SPECTRUM_SAB') {
        this.spectrumSAB = e.data.sab;
        this.spectrumData = new Float32Array(this.spectrumSAB);
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0][0];
    if (!input) return true;

    let blockRmsSum = 0;

    for (let i = 0; i < input.length; i++) {
      let x = input[i];

      if (this.currentWeighting === 'A') {
        for (let s = 0; s < 3; s++) {
          let w = x - this.splStages[s].a[1] * this.splW[s][0] - this.splStages[s].a[2] * this.splW[s][1];
          x = this.splStages[s].b[0] * w + this.splStages[s].b[1] * this.splW[s][0] + this.splStages[s].b[2] * this.splW[s][1];
          this.splW[s][1] = this.splW[s][0];
          this.splW[s][0] = w;
        }
      } else if (this.currentWeighting === 'C') {
        for (let s = 0; s < 2; s++) {
          let w = x - this.cStages[s].a[1] * this.cW[s][0] - this.cStages[s].a[2] * this.cW[s][1];
          x = this.cStages[s].b[0] * w + this.cStages[s].b[1] * this.cW[s][0] + this.cStages[s].b[2] * this.cW[s][1];
          this.cW[s][1] = this.cW[s][0];
          this.cW[s][0] = w;
        }
      }
      blockRmsSum += x * x;
      this.rmsSum += x * x;
    }

    // 1. Cálculo de Nivel Instantáneo con Balística (IEC 61672)
    const blockRms = Math.sqrt(blockRmsSum / input.length);
    const k = this.currentResponse === 'FAST' ? this.fastK : this.slowK;
    this.lpFiltered += (blockRms - this.lpFiltered) * k;

    this.sampleCount += input.length;

    // Report SPL every ~42ms (2048 samples)
    if (this.sampleCount >= 2048) {
      const noiseFloor = 20.0; // Noise floor for typical environment/mic
      const dbLp = Math.max(noiseFloor, 20 * Math.log10(Math.max(this.lpFiltered, 1e-9)) + this.calibrationOffset);
      const rmsTotal = Math.sqrt(this.rmsSum / this.sampleCount);
      const dbLeq = Math.max(noiseFloor, 20 * Math.log10(Math.max(rmsTotal, 1e-9)) + this.calibrationOffset);

      this.port.postMessage({ 
        type: 'SPL_UPDATE', 
        lp: dbLp, 
        leq: dbLeq,
        lmax: dbLp, // En este intervalo
        lmin: dbLp  // En este intervalo
      });
      
      this.rmsSum = 0;
      this.sampleCount = 0;
    }

    return true;
  }
}

registerProcessor('vostok-dsp-processor', VostokDSPProcessor);
