import { useRef, useCallback, useEffect } from 'react';

export const useWakeLock = () => {
  const wakeLock = useRef(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
      try {
        wakeLock.current = await navigator.wakeLock.request('screen');
        console.log('[Vostok System] WakeLock Acquired');
      } catch (err) {
        console.error(`[Vostok System] WakeLock Error: ${err.name}, ${err.message}`);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLock.current) {
      wakeLock.current.release();
      wakeLock.current = null;
      console.log('[Vostok System] WakeLock Released');
    }
  }, []);

  // Safety cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLock.current) {
        wakeLock.current.release();
        wakeLock.current = null;
      }
    };
  }, []);

  return { requestWakeLock, releaseWakeLock };
};
