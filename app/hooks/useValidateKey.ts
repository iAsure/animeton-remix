import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@constants/config';
import { useConfig } from '@context/ConfigContext';

interface ValidationResult {
  error?: boolean;
  message?: string;
  valid?: boolean;
}

const useValidateKey = (key: string | undefined) => {
  const { updateConfig } = useConfig();

  const [isValid, setIsValid] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cleanKeyState = () => {
    updateConfig({ user: { activationKey: null } });
  }

  const validateKey = useCallback(async () => {
    if (!key) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/keys/validate/${key}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result: ValidationResult = await response.json();

      if (result.error) {
        setError(result.message || null);
      } else {
        const isKeyValid = Boolean(result?.valid);
        setIsValid(isKeyValid);

        if (!isKeyValid) {
          cleanKeyState();
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error validating key:', error);
      setError(error.message || 'Ocurrió un error al validar la clave');
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  return { isValid, isLoading, error, validateKey };
};

export default useValidateKey;
