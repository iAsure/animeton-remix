import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@constants/config';

const useApiSubtitles = (infoHash: string | undefined) => {
  const [subtitles, setSubtitles] = useState<string | null>(null);
  
  const [fetchStatus, setFetchStatus] = useState({
    loading: false,
    error: null as string | null
  });

  const [postStatus, setPostStatus] = useState({
    loading: false,
    error: null as string | null
  });

  const fetchSubtitles = useCallback(async () => {
    if (!infoHash) return;

    setFetchStatus({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/${infoHash}`);
      const result = await response.text();

      const resultIsJson = result.startsWith('{') && result.endsWith('}');

      if (!result || resultIsJson) {
        throw new Error('No se encontraron subtítulos');
      }

      setSubtitles(result);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Ocurrió un error al obtener los subtítulos';
      setFetchStatus(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setFetchStatus(prev => ({ ...prev, loading: false }));
    }
  }, [infoHash]);

  const postSubtitles = useCallback(async (subContent: string) => {
    if (!infoHash) return;

    setPostStatus({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/${infoHash}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': window.electron.env.ANIMETON_API_KEY
        },
        body: JSON.stringify({ content: subContent }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar los subtítulos');
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Ocurrió un error al guardar los subtítulos';
      setPostStatus(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setPostStatus(prev => ({ ...prev, loading: false }));
    }
  }, [infoHash]);

  return {
    subtitles,
    fetchSubtitles,
    postSubtitles,
    fetchStatus,
    postStatus
  };
};

export default useApiSubtitles;
