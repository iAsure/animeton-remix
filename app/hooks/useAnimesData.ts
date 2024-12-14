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

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/anime/list?quantity=${perPage}`);
        const data = await response.json() as any[];

        if (!data) return;
        
        const startIndex = (page - 1) * perPage;
        const paginatedData = data.slice(startIndex, startIndex + perPage);
        const finalData = displayCount ? paginatedData.slice(0, displayCount) : paginatedData;
        
        setAnimes(finalData);
      } catch (error) {
        console.error('Error fetching anime data:', error);
      }
    };

    fetchAnimes();
  }, [page, perPage, displayCount]);

  return animes;
};

export default useAnimesData;
