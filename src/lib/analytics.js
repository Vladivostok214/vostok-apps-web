import { logTelemetry, logEvent } from './database';

/**
 * Initializes the local logging system.
 * Zero-Cloud policy active.
 */
export const initAnalytics = () => {
  console.info("[Vostok Labs] Local Analytics Engine Initialized. Zero-Cloud policy active.");
};

/**
 * Captures hardware specifications locally.
 */
export const captureVostokHardware = (audioContext) => {
  if (!audioContext || typeof window === 'undefined') return;

  const isMobile = /iphone|ipad|ipod|android/.test(window.navigator.userAgent.toLowerCase());
  const data = {
    sample_rate: audioContext.sampleRate,
    base_latency: audioContext.baseLatency || 0,
    is_mobile: isMobile,
    user_agent: window.navigator.userAgent
  };

  logTelemetry('hardware_spec', data);
  console.debug("[Vostok Telemetry] Hardware captured locally", data);
};

/**
 * Tracks events locally in the database.
 */
export const trackEvent = (eventName, properties = {}) => {
  logEvent(eventName, properties);
  
  if (import.meta.env.DEV) {
    console.debug(`[Vostok Event] ${eventName}`, properties);
  }
};

/**
 * Custom Log Collector for performance and crashes.
 */
export const captureError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date()
  };
  
  logEvent('error_report', errorData);
  console.error("[Vostok Crash Report]", errorData);
};
