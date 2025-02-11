import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import log from 'electron-log';

type NavigationEvent = {
  path: string;
};

const useProtocolEvents = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const eventHandlers = {
      navigation: (event, data: NavigationEvent) => {
        log.info('Navigation event received:', data.path);
        navigate(data.path);
      }
    };

    const subscribeToEvents = () => {
      window.api.navigation.onNavigate.subscribe((event, data: NavigationEvent) => {
        eventHandlers.navigation(event, data);
      });
    };

    const unsubscribeFromEvents = () => {
      window.api.navigation.onNavigate.unsubscribe(eventHandlers.navigation);
    };

    subscribeToEvents();
    return unsubscribeFromEvents;
  }, [navigate]);
};

export default useProtocolEvents;
