import { prettyBytes } from '@utils/strings';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

interface EpisodeProgress {
  isPaused: boolean;
  downloadSpeed: number;
  uploadSpeed: number;
  progress: number;
  remaining: string;
}

interface EpisodeInfo {
  animeName: string;
  animeImage: string;
  animeIdAnilist: number;
  episodeImage: string;
  episodeNumber: number;
  episodeTorrentUrl: string;
  pubDate: string;
}

interface Episode {
  episodeId: string;
  torrentHash: string;
  progress: EpisodeProgress;
  episodeInfo: EpisodeInfo;
}

interface EpisodeItemProps {
  episode: Episode;
}

interface EpisodesListProps {
  episodes: Episode[];
}

const EpisodeItem = ({ episode }: EpisodeItemProps) => {
  const [localIsPaused, setLocalIsPaused] = useState(episode.progress.isPaused);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProgressAfterResume, setHasProgressAfterResume] = useState(true);

  useEffect(() => {
    setLocalIsPaused(episode.progress.isPaused);
  }, [episode.progress.isPaused]);

  useEffect(() => {
    if (!localIsPaused && !hasProgressAfterResume && episode.progress.downloadSpeed > 0) {
      setHasProgressAfterResume(true);
      setIsProcessing(false);
    }
  }, [localIsPaused, hasProgressAfterResume, episode.progress.downloadSpeed]);

  const handlePauseResume = async () => {
    try {
      setIsProcessing(true);
      if (localIsPaused) {
        setHasProgressAfterResume(false);
      }
      const response = await window.api.torrent.pause({
        infoHash: episode.torrentHash,
        torrentUrl: episode.episodeInfo.episodeTorrentUrl,
      });
      setLocalIsPaused(response.isPaused);
      if (response.isPaused) {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error al cambiar estado del torrent:', error);
      setIsProcessing(false);
    }
  };

  const handleRemove = async () => {
    try {
      await window.api.torrent.remove(episode.torrentHash);
    } catch (error) {
      console.error('Error al eliminar torrent:', error);
    }
  };

  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">Episodio {episode.episodeInfo.episodeNumber}</span>
        {!localIsPaused && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex items-center gap-0.5">
              <Icon icon="material-symbols:download" className="text-sm" />
              {prettyBytes(episode.progress.downloadSpeed)}/s
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1">
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${localIsPaused ? 'bg-zinc-500' : 'bg-[#ff5680]'}`}
              style={{
                width: `${Math.round(episode.progress.progress * 100)}%`
              }}
            />
          </div>
          <div className="mt-1 text-xs text-zinc-500 flex justify-between">
            <span className={localIsPaused ? 'text-zinc-400' : 'text-zinc-500'}>
              {Math.round(episode.progress.progress * 100)}%
            </span>
            <span className={localIsPaused ? 'text-zinc-400' : 'text-zinc-500'}>
              {localIsPaused ? 'Pausado' : episode.progress.remaining}
            </span>
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            disabled={isProcessing}
            className="bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-wait"
            onClick={handlePauseResume}
          >
            <Icon
              icon={
                isProcessing 
                  ? 'mdi:loading' 
                  : localIsPaused
                    ? 'material-symbols:play-arrow'
                    : 'material-symbols:pause'
              }
              className={`text-lg ${isProcessing ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="bg-zinc-800 text-zinc-400 hover:text-red-500"
            onClick={handleRemove}
          >
            <Icon icon="material-symbols:delete" className="text-lg" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const EpisodesList = ({ episodes }: EpisodesListProps) => {
  const sortedEpisodes = [...episodes].sort((a, b) => 
    a.episodeInfo.episodeNumber - b.episodeInfo.episodeNumber
  );

  return (
    <div className="space-y-3 divide-y divide-zinc-800">
      {sortedEpisodes.map(episode => (
        <EpisodeItem key={episode.episodeId} episode={episode} />
      ))}
    </div>
  );
};

export default EpisodesList; 