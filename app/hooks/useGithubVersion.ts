import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@constants/config';

interface VersionData {
  version: string;
  changelog: string[];
}

const useGithubVersion = (version = 'latest') => {
  const [data, setData] = useState<VersionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/github/${version}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setError(message);
        console.error('Error fetching version data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersion();
  }, [version]);

  return { data, isLoading, error };
};

export default useGithubVersion;
