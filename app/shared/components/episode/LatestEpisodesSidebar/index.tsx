import { useEffect, memo } from 'react';

import useRSSData from '@hooks/useRSSData';
import { useTorrentPlayer } from '@context/TorrentPlayerContext';
import { useNotification } from '@context/NotificationContext';

import Episode from './episode';
import EpisodeSkeleton from './skeleton';

interface LatestEpisodesSidebarProps {
  state: any;
  bannerColors: string[];
  sectionTitle: string;
}

const LatestEpisodesSidebar = memo(({ state, bannerColors, sectionTitle }: LatestEpisodesSidebarProps) => {
  const { playEpisode, loadingHash } = useTorrentPlayer();
  const { showNotification } = useNotification();

  const { rssAnimes, isLoading, error } = useRSSData({
    page: 1,
    perPage: 10
  });

  useEffect(() => {
    if (error) {
      showNotification({
        title: 'Error',
        message: error,
        type: 'error',
      });
    }
  }, [error, state]);

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
              isLoading={loadingHash === anime?.torrent?.infoHash}
              onPlay={() => playEpisode(anime)}
            />
          ))}
      </div>
    </div>
  );
});

export default LatestEpisodesSidebar;
