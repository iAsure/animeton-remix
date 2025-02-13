import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@constants/config';

const useAnimeRecommendations = (idAnilist: number | string) => {
  const [recommendations, setRecommendations] = useState<any>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/anime/recommendations/${idAnilist}`
        );
        const data = await response.json();
        setRecommendations(data);
      } catch (error) {
        console.error('Error fetching anime recommendations:', error);
      }
    };

    fetchRecommendations();
  }, [idAnilist]);

  return recommendations;
};

export default useAnimeRecommendations;
