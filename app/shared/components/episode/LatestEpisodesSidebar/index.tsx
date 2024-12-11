import { useState, useEffect, memo } from 'react';

import useRSSData from '@hooks/useRSSData';

import Episode from './episode';
import EpisodeSkeleton from './skeleton';

interface LatestEpisodesSidebarProps {
  state: any;
  bannerColors: string[];
  sectionTitle: string;
}

const LatestEpisodesSidebar = memo(({ state, bannerColors, sectionTitle }: LatestEpisodesSidebarProps) => {
  const [loadingEpisodeId, setLoadingEpisodeId] = useState<string | null>(null);

  const { rssAnimes, isLoading, error } = useRSSData({
    page: 1,
    perPage: 10
  });

  useEffect(() => {
    if (error) {
      // sendNotification(state, { message: error });
    }
  }, [error, state]);

  const handlePlay = (anime: any) => {
    // const infoHash = anime?.torrent?.infoHash;
    // if (!infoHash) {
    //   return sendNotification(state, { message: 'Episodio no disponible.' });
    // }

    // if (loadingEpisodeId) {
    //   return sendNotification(state, { 
    //     title: 'Wow, espera!', 
    //     message: 'Ya estamos cargando un episodio.', 
    //     type: 'alert' 
    //   });
    // }

    // setLoadingEpisodeId(infoHash);
    // TorrentPlayer.playTorrent(anime, state, setLoadingEpisodeId);
  };

  return (
    <div className="flex flex-col p-4 gap-2 items-start w-80 overflow-hidden">
      <h2 className="text-xl font-semibold truncate w-full">{sectionTitle}</h2>
      <div className="flex flex-col gap-4 p-6 bg-zinc-950 rounded-xl border-2 border-zinc-900 w-full overflow-hidden">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
            <EpisodeSkeleton
              color={bannerColors[0]}
              key={`rss-episode-skeleton-${i}`}
            />
          ))
          : rssAnimes.map((anime, i) => (
            <Episode
              key={`rss-episode-${i}`}
              anime={anime}
              isLoading={loadingEpisodeId === anime?.torrent?.infoHash}
              onPlay={() => handlePlay(anime)}
            />
          ))}
      </div>
    </div>
  );
});

export default LatestEpisodesSidebar;
