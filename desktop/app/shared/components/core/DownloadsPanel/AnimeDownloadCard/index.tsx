import { prettyBytes } from '@utils/strings';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import EpisodesList from './EpisodesList';

interface AnimeGroup {
  animeId: number;
  animeName: string;
  animeImage: string;
  episodes: Array<{
    episodeId: string;
    torrentHash: string;
    progress: {
      progress: number;
      downloadSpeed: number;
      uploadSpeed: number;
      isPaused: boolean;
      remaining: string;
    };
    episodeInfo: {
      animeName: string;
      animeImage: string;
      animeIdAnilist: number;
      episodeImage: string;
      episodeNumber: number;
      episodeTorrentUrl: string;
      pubDate: string;
    };
  }>;
}

interface AnimeDownloadCardProps {
  animeGroup: AnimeGroup;
}

const calculateGroupProgress = (episodes: AnimeGroup['episodes']) => {
  const totalProgress = episodes.reduce((acc, episode) => acc + episode.progress.progress, 0);
  return totalProgress / episodes.length;
};

const calculateGroupSpeeds = (episodes: AnimeGroup['episodes']) => {
  return episodes.reduce((acc, episode) => ({
    downloadSpeed: acc.downloadSpeed + episode.progress.downloadSpeed,
    uploadSpeed: acc.uploadSpeed + episode.progress.uploadSpeed
  }), { downloadSpeed: 0, uploadSpeed: 0 });
};

const AnimeDownloadCard = ({ animeGroup }: AnimeDownloadCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalProgress = calculateGroupProgress(animeGroup.episodes);
  const { downloadSpeed, uploadSpeed } = calculateGroupSpeeds(animeGroup.episodes);
  const isPaused = animeGroup.episodes.every(ep => ep.progress.isPaused);

  return (
    <div className="text-white bg-zinc-900 rounded-md hover:bg-zinc-800/50 transition-colors">
      <div className="p-3">
        <div className="flex items-center gap-3">
          <img
            src={animeGroup.animeImage}
            alt={animeGroup.animeName}
            width={64}
            height={64}
            className="aspect-square object-cover rounded-md"
          />
          <div className="flex flex-col gap-0.5 w-full min-w-0">
            <div className="font-medium text-sm min-w-0">
              <span className="block truncate">{animeGroup.animeName}</span>
            </div>
            <div className="text-xs text-zinc-400">
              {animeGroup.episodes.length} {animeGroup.episodes.length === 1 ? 'episodio' : 'episodios'}
            </div>
            {!isPaused && (
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                <span className="flex items-center gap-0.5">
                  <Icon icon="material-symbols:download" className="text-sm" />
                  {prettyBytes(downloadSpeed)}/s
                </span>
                <span className="flex items-center gap-0.5">
                  <Icon icon="material-symbols:upload" className="text-sm" />
                  {prettyBytes(uploadSpeed)}/s
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isPaused ? 'bg-zinc-500' : 'bg-[#ff5680]'}`}
              style={{
                width: `${Math.round(totalProgress * 100)}%`
              }}
            />
          </div>
          <div className="mt-1 text-xs text-zinc-500 flex justify-between">
            <span className={isPaused ? 'text-zinc-400' : 'text-zinc-500'}>
              {Math.round(totalProgress * 100)}%
            </span>
            <span className={isPaused ? 'text-zinc-400' : 'text-zinc-500'}>
              {isPaused ? 'Pausado' : ''}
            </span>
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <Button
            size="sm"
            variant="light"
            className="w-full h-4 px-0 text-zinc-400 hover:text-white"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 44 8"
              className="w-full h-4"
            >
              <path 
                fill="currentColor" 
                d={isExpanded 
                  ? "M22 2L40 6L44 5L22 0L0 5L4 6L22 2Z"
                  : "M22 4L40 0L44 1L22 6L0 1L4 0L22 4Z"
                }
              />
            </svg>
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-zinc-800 p-3">
          <EpisodesList episodes={animeGroup.episodes} />
        </div>
      )}
    </div>
  );
};

export default AnimeDownloadCard; 