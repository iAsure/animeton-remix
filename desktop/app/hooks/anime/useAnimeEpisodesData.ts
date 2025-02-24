import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@constants/config';

interface Episode {
  title?: {
    en?: string;
  };
  episodeNumber?: number;
  episode?: number;
  torrent?: {
    episode?: number;
  }
}

const useAnimeEpisodesData = (idAnilist: number | string, withTorrents = false) => {
  const defaultEpisodes = Array.from({ length: 8 });
  const [episodes, setEpisodes] = useState<Episode[]>(defaultEpisodes);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnimeEpisodes = useCallback(async () => {
    if (!idAnilist) return;
    
    setIsLoading(true);
    setEpisodes(defaultEpisodes); // Restart episodes array

    try {
      const response = await fetch(`${API_BASE_URL}/anime/episodes/${idAnilist}?torrents=${withTorrents}&withHevc=false`);
      const data = await response.json();
      setEpisodes(data.episodes);
    } catch (error) {
      console.error('Error fetching anime data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [idAnilist, withTorrents]);

  useEffect(() => {
    fetchAnimeEpisodes();
  }, [fetchAnimeEpisodes]);

  return { episodes, isLoading };
};

export default useAnimeEpisodesData;