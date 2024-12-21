import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@constants/config';

interface UseAnimesDataProps {
  page?: number;
  perPage?: number;
  displayCount?: number;
}

const useAnimesData = ({ 
  page = 1, 
  perPage = 28, 
  displayCount 
}: UseAnimesDataProps = {}) => {
  const [animes, setAnimes] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnimes = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/anime/list?quantity=${perPage}`);
        if (!response.ok) throw new Error('Failed to fetch anime data');
        
        const data = await response.json();
        if (!data) return;
        
        const startIndex = (page - 1) * perPage;
        const paginatedData = data.slice(startIndex, startIndex + perPage);
        const finalData = displayCount ? paginatedData.slice(0, displayCount) : paginatedData;
        
        setAnimes(finalData);
      } catch (error) {
        setError(error.message || 'Ha ocurrido un error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnimes();
  }, [page, perPage, displayCount]);

  return { animes, isLoading, error };
};

export default useAnimesData;
