import { useCallback, useState, useRef } from 'react';
import log from 'electron-log';
import { API_BASE_URL } from '@constants/config';
import { Anime } from '@shared/types/anime';

export default function useSearchAnimes(query: string, limit: number = 1) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Anime[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const dataRef = useRef<Anime[]>([]);

  const searchAnimes = useCallback(async (): Promise<Anime[]> => {
    if (!query.trim()) {
      setData([]);
      return [];
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 15000);

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/anime/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeName: query, limit }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Error en la búsqueda: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      dataRef.current = result;
      setError(null);
      return result;
    } catch (err) {
      const error = err as Error;
      if (!error) return dataRef.current;

      log.error('Error searching animes:', error);

      if (error.name === 'AbortError') {
        if (!dataRef.current.length) {
          setError(
            'La búsqueda tardó demasiado tiempo. Por favor, inténtelo de nuevo.'
          );
        }
      } else {
        setError(`Error: ${error.message}`);
        setData([]);
      }

      return dataRef.current;
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [query, limit]);

  return {
    searchAnimes,
    isLoading,
    error,
    data,
  };
}
