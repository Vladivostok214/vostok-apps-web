import posthog from 'posthog-js';
import { createClient } from '@supabase/supabase-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || 'phc_placeholder';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.posthog.com';

export const initAnalytics = () => {
  if (typeof window !== 'undefined' && POSTHOG_KEY !== 'phc_placeholder') {
    if (!window._posthog_initialized) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        ui_host: 'https://us.posthog.com',
        persistence: 'memory', // Zero-Footprint, memory only
        disable_session_recording: true,
        autocapture: false, // Ensure no sensitive data is captured automatically
        capture_pageview: false,
        capture_pageleave: false,
        disable_cookie: true, // No cookies
      });
      window._posthog_initialized = true;
    }
  }
};

export const captureVostokHardware = (audioContext) => {
  if (!audioContext || typeof window === 'undefined' || POSTHOG_KEY === 'phc_placeholder') return;

  const isMobile = /iphone|ipad|ipod|android/.test(window.navigator.userAgent.toLowerCase());

  posthog.capture('hardware_spec', {
    sample_rate: audioContext.sampleRate,
    base_latency: audioContext.baseLatency || 0,
    is_mobile: isMobile
  });
};

export const trackEvent = (eventName, properties) => {
  if (POSTHOG_KEY !== 'phc_placeholder') {
    posthog.capture(eventName, properties);
  }
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
