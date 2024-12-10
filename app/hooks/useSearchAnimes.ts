import { useCallback, useState } from 'react';
import eLog from 'electron-log';
import { API_BASE_URL } from '@constants/config';

interface AnimeResult {
  // Add your anime type properties here
  id: string;
  title: string;
  // ... other properties
}

export default function useSearchAnimes(query: string, limit: number = 1) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnimeResult[]>([]);

  const searchAnimes = useCallback(async (): Promise<AnimeResult[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/anime/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeName: query, limit }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const error = err as Error;
      eLog.error('Error searching animes:', error);
      
      setError(error.name === 'AbortError' 
        ? 'La búsqueda tardó demasiado tiempo. Por favor, inténtelo de nuevo.' 
        : `Error: ${error.message}`);
      
      setData([]);
      return [];
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [query, limit]);

  return {
    searchAnimes,
    isLoading,
    error,
    data
  };
};
