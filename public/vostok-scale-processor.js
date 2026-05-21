/**
 * Vostok Scale Processor
 * Optimized AudioWorklet for Scale Validation
 * Vostok Labs • 2026
 */

class VostokScaleProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastY = 0;
    this.decimationFactor = 8;
    this.decimatedLen = 512;
    this.decimatedBuffer = new Float32Array(this.decimatedLen);
    this.yinBuffer = new Float32Array(this.decimatedLen >> 1);
    this.diffBuffer = new Float32Array(this.decimatedLen >> 1);
    this.samplesSinceLastAnalysis = 0;

    // Telemetry - Hybrid Path
    this.telemetrySAB = null;
    this.telemetryData = null;
    this.usePostMessageFallback = false;

    this.port.onmessage = (e) => {
      if (e.data.type === 'SET_TELEMETRY_SAB') {
        this.telemetrySAB = e.data.sab;
        this.telemetryData = new Float32Array(this.telemetrySAB);
        this.usePostMessageFallback = false;
      }
      if (e.data.type === 'ENABLE_FALLBACK') {
        this.usePostMessageFallback = true;
      }
    };
  }

  condition(input) {
    const newDecimatedSamples = input.length / this.decimationFactor;
    this.decimatedBuffer.set(this.decimatedBuffer.subarray(newDecimatedSamples));
    let writeIdx = this.decimatedLen - newDecimatedSamples;
    for (let i = 0; i < input.length; i += this.decimationFactor) {
      let sum = 0;
      for (let j = 0; j < this.decimationFactor; j++) {
        const x = input[i + j] || 0;
        const y = x - this.lastY + (0.995 * this.lastY);
        this.lastY = x;
        sum += y;
      }
      this.decimatedBuffer[writeIdx++] = sum / this.decimationFactor;
    }
    this.samplesSinceLastAnalysis += input.length;
  }

  estimatePitch(buf, sampleRate) {
    const N = buf.length;
    const halfN = N >> 1;
    const yinBuffer = this.yinBuffer;
    const diffBuffer = this.diffBuffer;

    for (let tau = 0; tau < halfN; tau++) {
      yinBuffer[tau] = 0;
      for (let j = 0; j < halfN; j++) {
        const delta = buf[j] - buf[j + tau];
        yinBuffer[tau] += delta * delta;
      }
      diffBuffer[tau] = yinBuffer[tau];
    }

    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfN; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] *= tau / (runningSum || 0.0001);
    }

    let period = -1;
    const threshold = 0.15;
    for (let tau = 1; tau < halfN; tau++) {
      if (yinBuffer[tau] < threshold) {
        while (tau + 1 < halfN && yinBuffer[tau + 1] < yinBuffer[tau]) tau++;
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
      const denom = 2 * (2 * s1 - s2 - s0);
      if (Math.abs(denom) > 0.00001) betterPeriod = period + (s2 - s0) / denom;
    }
    return sampleRate / betterPeriod;
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input || input.length === 0) return true;

    for (let i = 0; i < input.length; i++) {
      if (Math.abs(input[i]) >= 0.99) {
        if (this.telemetryData) this.telemetryData[0] = -2; 
        return true;
      }
    }

    this.condition(input);

    let freq = -1;
    if (this.samplesSinceLastAnalysis >= 1024) {
      freq = this.estimatePitch(this.decimatedBuffer, sampleRate / this.decimationFactor);
      this.samplesSinceLastAnalysis = 0;
      
      if (this.telemetryData) {
        this.telemetryData[0] = freq;
      }
      if (this.usePostMessageFallback) {
        this.port.postMessage({ type: 'FREQ', val: freq });
      }
    }

    let sumSq = 0;
    for (let i = 0; i < input.length; i++) sumSq += input[i] * input[i];
    const rms = Math.sqrt(sumSq / input.length);

    if (this.telemetryData) {
      this.telemetryData[1] = rms; 
    }
    if (this.usePostMessageFallback) {
      this.port.postMessage({ type: 'VOL', val: rms });
    }

    return true;
  }
}

registerProcessor('vostok-scale-processor', VostokScaleProcessor);
