import posthog from 'posthog-js';
import { useEffect, useState } from 'react';

export function usePostHog() {
  const [client, setClient] = useState<typeof posthog | null>(null);

  useEffect(() => {
    setClient(posthog);
  }, []);

  return client;
}

export function initPostHog(apiKey: string) {
  return posthog.init(apiKey, {
    api_host: 'https://us.i.posthog.com'
  });
}