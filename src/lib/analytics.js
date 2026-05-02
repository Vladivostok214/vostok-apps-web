import { createClient } from '@supabase/supabase-js';
import posthog from 'posthog-js';

// --- CONFIGURACIÓN DE SUPABASE (Mensajes y Datos) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- CONFIGURACIÓN DE POSTHOG (Analíticas de Usuario) ---
export const initAnalytics = () => {
  const token = import.meta.env.VITE_POSTHOG_KEY;
  if (token) {
    posthog.init(token, {
      api_host: 'https://app.posthog.com',
      autocapture: true, // Captura clics automáticamente
      capture_pageview: true,
    });
  }
};

export const trackEvent = (name, properties = {}) => {
  if (import.meta.env.PROD) {
    posthog.capture(name, properties);
  } else {
    console.log(`[Analytics Event]: ${name}`, properties);
  }
};
