import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@constants/config';

interface Anime {
  idAnilist: number;
  title: {
    romaji: string;
    native: string;
  };
  bannerImage?: string;
  coverImage: {
    extraLarge: string;
  };
  genres: string[];
  description?: string;
}

const useAnimeDetails = (idAnilist: string | number) => {
  const [anime, setAnime] = useState<Anime | null>(null);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/anime/list/${idAnilist}`);
        const data = await response.json();
        setAnime(data);
      } catch (error) {
        console.error('Error fetching anime data:', error);
      }
    };

    fetchAnime();
  }, [idAnilist]);

  return anime;
};

export default useAnimeDetails;
