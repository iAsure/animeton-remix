import { useCallback, useRef } from 'react';
import { API_BASE_URL } from '@constants/config';
import { useNotification } from '@context/NotificationContext';

const useInternetConnection = () => {
  const { showNotification } = useNotification();
  const isOfflineRef = useRef(false);
  const notificationShownRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const checkInternetConnection = useCallback(async () => {
    try {
      const response = await fetch(API_BASE_URL, { method: 'HEAD' });
      if (!response.ok && response.status !== 404) {
        throw new Error('Network response was not ok');
      }
      if (isOfflineRef.current) {
        isOfflineRef.current = false;
        notificationShownRef.current = false;
      }
    } catch (error) {
      if (!isOfflineRef.current && !notificationShownRef.current) {
        isOfflineRef.current = true;
        notificationShownRef.current = true;
        showNotification({
          title: 'No hay conexión a internet',
          message: 'Vuelve a intentarlo más tarde',
          type: 'error',
          duration: null
        });
      }
    }
  }, [showNotification]);

  const startMonitoring = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    checkInternetConnection();
    intervalRef.current = setInterval(checkInternetConnection, 60000);
  }, [checkInternetConnection]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  return {
    startMonitoring,
    stopMonitoring
  };
};

export default useInternetConnection;
