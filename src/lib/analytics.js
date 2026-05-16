import { logTelemetry, logEvent, saveMessageLocally } from './database';

/**
 * Initializes the local logging system.
 * Replaces PostHog initialization.
 */
export const initAnalytics = () => {
  console.info("[Vostok Labs] Local Analytics Engine Initialized. Zero-Cloud policy active.");
  // Here we could start a background sync process if a server URL is provided
};

/**
 * Captures hardware specifications locally.
 * Replaces PostHog capture.
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
 * Replaces PostHog capture.
 */
export const trackEvent = (eventName, properties = {}) => {
  logEvent(eventName, properties);
  
  // Also log to console in dev mode for visibility
  if (import.meta.env.DEV) {
    console.debug(`[Vostok Event] ${eventName}`, properties);
  }
};

/**
 * Custom Log Collector for performance and crashes.
 * Can be called during DSP processing or globally.
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

// Supabase Mock / Bridge
// We keep the export name but point to local storage
export const supabase = {
  from: () => ({
    insert: async (rows) => {
      try {
        for (const row of rows) {
          await saveMessageLocally(row.user_mail, row.content);
        }
        return { error: null };
      } catch (e) {
        return { error: e };
      }
    }
  })
};
