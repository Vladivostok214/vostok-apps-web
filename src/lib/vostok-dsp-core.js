// src/lib/vostok-dsp-core.js
// Core DSP logic isolated for Benchmark and Production use

const MAX_BUFFER_SIZE = 8192;
const sharedDownsampleBuffer = new Float32Array(MAX_BUFFER_SIZE >> 2);
const sharedYinBuffer = new Float32Array(MAX_BUFFER_SIZE >> 1);
const sharedDiffBuffer = new Float32Array(MAX_BUFFER_SIZE >> 1);

/**
 * Optimized YIN Algorithm (Bitwise & Zero-Allocation)
 */
export const autoCorrelate = (buf, sampleRate, isBass = false) => {
  const SIZE = buf.length;
  let activeBuf = buf;
  let activeSampleRate = sampleRate;

  if (isBass) {
    const downsampledLen = SIZE >> 2;
    for (let i = 0; i < downsampledLen; i++) {
      sharedDownsampleBuffer[i] = (buf[i << 2] + buf[(i << 2) + 1] + buf[(i << 2) + 2] + buf[(i << 2) + 3]) * 0.25;
    }
    activeBuf = sharedDownsampleBuffer.subarray(0, downsampledLen);
    activeSampleRate = sampleRate * 0.25;
  }

  const N = activeBuf.length;
  const halfN = N >> 1;
  const yinBuffer = sharedYinBuffer.subarray(0, halfN);
  const diffBuffer = sharedDiffBuffer.subarray(0, halfN);

  let tau = 0, j = 0, delta = 0, runningSum = 0;

  for (tau = 0; tau < halfN; tau++) {
    yinBuffer[tau] = 0;
    for (j = 0; j < halfN; j++) {
      delta = activeBuf[j] - activeBuf[j + tau];
      yinBuffer[tau] += delta * delta;
    }
    diffBuffer[tau] = yinBuffer[tau];
  }

  yinBuffer[0] = 1;
  runningSum = 0;
  for (tau = 1; tau < halfN; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / (runningSum || 1);
  }

  let period = -1;
  const threshold = 0.15;
  for (tau = 1; tau < halfN; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < halfN && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      period = tau;
      break;
    }
  }

  if (period === -1) return -1;

  let betterPeriod = period;
  if (period > 0 && period < halfN - 1) {
    const s0 = diffBuffer[period - 1];
    const s1 = diffBuffer[period];
    const s2 = diffBuffer[period + 1];
    betterPeriod = period + (s2 - s0) / (2 * (2 * s1 - s2 - s0) || 1);
  }

  return activeSampleRate / betterPeriod;
};

/**
 * HPS (Harmonic Product Spectrum) Core
 */
export const calculateHPS = (freqData, bufferLength) => {
    const hpsLen = bufferLength / 3 | 0;
    const hps = new Float32Array(hpsLen);
    for (let i = 0; i < hpsLen; i++) {
        const mag1 = Math.pow(10, freqData[i] * 0.05);
        const mag2 = Math.pow(10, freqData[i << 1] * 0.05);
        const mag3 = Math.pow(10, freqData[i * 3] * 0.05);
        hps[i] = mag1 * mag2 * mag3;
    }
    return hps;
};

/**
 * Chroma Feature Extraction Core
 */
export const extractChroma = (hps, sampleRate, fftSize) => {
    const chroma = new Float32Array(12);
    let freq, noteIndex;
    for (let i = 20; i < hps.length; i++) { 
      freq = i * sampleRate / fftSize;
      if (freq < 2000) {
        noteIndex = Math.round(12 * Math.log2(freq * 0.00227272727) + 69) % 12;
        chroma[noteIndex] += hps[i];
      }
    }
    return chroma;
};
