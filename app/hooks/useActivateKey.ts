import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@constants/config';

const useActivateKey = (key: string) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const activateKey = useCallback(async () => {
    if (!key) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/keys/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const result = await response.json();

      if (result.error) {
        return setError(result.message);
      }

      setData(result);
    } catch (err) {
      console.error('Error activating key:', err);
      setError(err.message || 'Ocurrio un error al activar la clave');
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  return { data, isLoading, error, activateKey };
};

export default useActivateKey;
