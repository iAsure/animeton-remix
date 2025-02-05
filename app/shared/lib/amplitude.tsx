import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';

import { useEffect, useState } from 'react';

export function useAmplitude() {
  const [client, setClient] = useState<typeof amplitude | null>(null);

  useEffect(() => {
    setClient(amplitude);
  }, []);

  return client;
}

export function initAmplitude(apiKey: string) {
  const sessionReplayTracking = sessionReplayPlugin({ sampleRate: 1 });
  amplitude.add(sessionReplayTracking);

  return amplitude.init(apiKey, {
    autocapture: true,
    defaultTracking: { sessions: true },
  });
}
