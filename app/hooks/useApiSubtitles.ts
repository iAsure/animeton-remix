import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@constants/config';
import log from 'electron-log';

const useApiSubtitles = (infoHash: string | undefined) => {
  const [subtitles, setSubtitles] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubtitles = useCallback(async () => {
    if (!infoHash) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/${infoHash}`);
      const result = await response.text();

      const resultIsJson = result.startsWith('{') && result.endsWith('}');

      if (!result || resultIsJson) {
        return setError('No se encontraron subtítulos');
      }

      setSubtitles(result);
    } catch (err) {
      console.error('Error fetching subtitles:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al obtener los subtítulos'
      );
    } finally {
      setIsLoading(false);
    }
  }, [infoHash]);

  return { subtitles, isLoading, error, fetchSubtitles };
};

export default useApiSubtitles;
