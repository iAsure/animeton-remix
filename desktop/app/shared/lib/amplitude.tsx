import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { AMPLITUDE_CONFIG_KEY } from '@constants/config';

import { useEffect, useState } from 'react';

export function useAmplitude() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      initAmplitude();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  return amplitude;
}

export function initAmplitude() {
  if (amplitude.getUserId()) {
    return amplitude;
  }

  const sessionReplayTracking = sessionReplayPlugin({ sampleRate: 1 });
  amplitude.add(sessionReplayTracking);

  amplitude.init(atob(AMPLITUDE_CONFIG_KEY), {
    autocapture: true,
    defaultTracking: { sessions: true },
  });

  window.addEventListener('error', (event) => {
    amplitude.track('Uncaught Error', {
      message: event.error?.message,
      stack: event.error?.stack,
      type: 'window.error'
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    amplitude.track('Unhandled Promise Rejection', {
      message: event.reason?.message,
      stack: event.reason?.stack,
      type: 'promise.rejection'
    });
  });

  const originalConsoleError = console.error;
  console.error = (...args) => {
    amplitude.track('Console Error', {
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      type: 'console.error'
    });
    originalConsoleError.apply(console, args);
  };

  return amplitude;
}
