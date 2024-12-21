import { memo, useState } from 'react';
import { useNavigate } from '@remix-run/react';

import EpisodeCard from './episode';
import EpisodeCardSkeleton from './skeleton';

interface EpisodesListProps {
  episodesData: any[];
  isLoading: boolean;
  animeColors: string[];
  textColor: string;
}

const EpisodesList = memo(({ episodesData, isLoading, animeColors, textColor }: EpisodesListProps) => {
  const navigate = useNavigate();
  
  const [loadingEpisodeId, setLoadingEpisodeId] = useState<string | null>(null);

  const isWithinLastSixDays = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 6;
  };

  // Find most recent episode within last 6 days
  const sortedEpisodes = [...episodesData].sort((a, b) => {
    const aDate = new Date(a?.torrent?.date || 0);
    const bDate = new Date(b?.torrent?.date || 0);
    const isRecentA = isWithinLastSixDays(a?.torrent?.date);

    if (isRecentA && aDate > bDate) {
      return -1;
    }
    return 0;
  });

  const handlePlay = (episode) => {
    const infoHash = episode?.torrent?.hash;

    setLoadingEpisodeId(infoHash);
    const encodedUrl = encodeURIComponent(episode?.torrent?.torrentUrl);
    navigate(`/player?url=${encodedUrl}`, { viewTransition: true });
  };

  return (
    <div className="relative w-full">
      <div className="flex flex-col gap-4 p-4 px-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
            <EpisodeCardSkeleton color={animeColors[0]} key={i} />
          ))
          : sortedEpisodes.map((episode, i) => (
            <EpisodeCard
              episode={episode}
              key={`episode-${episode.episodeNumber}-${i}`}
              isLoading={loadingEpisodeId === episode?.torrent?.hash}
              isNew={isWithinLastSixDays(episode?.torrent?.date)}
              animeColors={animeColors}
              textColor={textColor}
              onPlay={() => handlePlay(episode)}
            />
          ))}
      </div>
    </div>
  );
});

export default EpisodesList;
