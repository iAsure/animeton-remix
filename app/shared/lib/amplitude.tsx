import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { AMPLITUDE_CONFIG_KEY } from '@constants/config';

import { useEffect, useState } from 'react';

export function useAmplitude() {
  const [client, setClient] = useState<typeof amplitude | null>(null);

  useEffect(() => {
    setClient(amplitude);
  }, []);

  return client;
}

export function initAmplitude() {
  const sessionReplayTracking = sessionReplayPlugin({ sampleRate: 1 });
  amplitude.add(sessionReplayTracking);

  return amplitude.init(atob(AMPLITUDE_CONFIG_KEY), {
    autocapture: true,
    defaultTracking: { sessions: true },
  });
}
