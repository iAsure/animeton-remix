import { useEffect, useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@constants/config';

const RETRY_INTERVAL = 2500;
const UPDATE_INTERVAL = 15000;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const ERROR_MESSAGE = 'No se encontraron los ultimos episodios';

interface Cache {
  [key: string]: {
    data: any[];
    timestamp: number;
  };
}

interface RSSDataProps {
  page: number;
  perPage: number;
  emptyState?: boolean;
}

interface RSSDataReturn {
  rssAnimes: any[] | null;
  isLoading: boolean;
  error: string | null;
}

// Global cache object
const cache: Cache = {};

const useRSSData = ({ page, perPage, emptyState }: RSSDataProps): RSSDataReturn => {
  const [rssAnimes, setRSSAnimes] = useState<any[] | null>(emptyState ? Array.from({ length: perPage }) : null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const cacheKey = useRef(`${page}-${perPage}`);
  const previousDataRef = useRef<any[] | null>(null);

  const fetchRSSAnimes = useCallback(async (bypassCache = false): Promise<boolean> => {
    const now = Date.now();
    // Check if cached data is still valid
    if (!bypassCache && cache[cacheKey.current] && now - cache[cacheKey.current].timestamp < CACHE_DURATION) {
      // Only update state if the cached data is different from the previous data
      if (JSON.stringify(cache[cacheKey.current].data) !== JSON.stringify(previousDataRef.current)) {
        setIsLoading(true);
        setRSSAnimes(cache[cacheKey.current].data);
        previousDataRef.current = cache[cacheKey.current].data;
        setIsLoading(false);
      }
      return true;
    }

    try {
      // Fetch new data from the API
      const response = await fetch(`${API_BASE_URL}/anime/rss?page=${page}&perPage=${perPage}&withHevc=false`);
      if (!response.ok) throw new Error(ERROR_MESSAGE);
      const rssAnimesData = await response.json();

      if (rssAnimesData.length === 0) {
        throw new Error(ERROR_MESSAGE);
      }

      if (rssAnimesData.length > 1) {
        // Only update state if the new data is different from the previous data
        if (JSON.stringify(rssAnimesData) !== JSON.stringify(previousDataRef.current)) {
          setIsLoading(true);
          setRSSAnimes(rssAnimesData);
          previousDataRef.current = rssAnimesData;
          // Update the cache with the new data
          cache[cacheKey.current] = { data: rssAnimesData, timestamp: now };
          setIsLoading(false);
        }
        return true;
      }
      return false;
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
      return false;
    }
  }, [page, perPage]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Function to set up the fetch interval
    const setupFetchInterval = (interval: number) => {
      clearInterval(intervalId);
      intervalId = setInterval(async () => {
        // Fetch data and check if it was successful
        const success = await fetchRSSAnimes(interval === UPDATE_INTERVAL);
        // If successful and currently in retry mode, switch to regular update interval
        if (success && interval === RETRY_INTERVAL) {
          setupFetchInterval(UPDATE_INTERVAL);
        }
      }, interval);
    };

    // Initial fetch and setup
    fetchRSSAnimes();
    setupFetchInterval(RETRY_INTERVAL);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [fetchRSSAnimes]);

  return { rssAnimes, isLoading, error };
};

export default useRSSData;
