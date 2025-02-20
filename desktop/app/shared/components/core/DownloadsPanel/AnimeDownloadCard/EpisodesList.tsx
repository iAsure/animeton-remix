import { prettyBytes } from '@utils/strings';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    if (
      !localIsPaused &&
      !hasProgressAfterResume &&
      episode.progress.downloadSpeed > 0
    ) {
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
    <div className="flex items-center justify-between gap-1">
      <div className="flex flex-col justify-between w-full h-full">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-zinc-300" style={{ fontSize: '13px' }}>
            Episodio {episode.episodeInfo.episodeNumber}
          </span>
          <span className={localIsPaused ? 'text-zinc-400' : 'text-zinc-500'}>
            {Math.round(episode.progress.progress * 100)}%
          </span>
        </div>

        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              localIsPaused ? 'bg-zinc-500' : 'bg-[#ff5680]'
            }`}
            style={{
              width: `${Math.round(episode.progress.progress * 100)}%`,
            }}
          />
        </div>

        <div className="mt-1 text-xs text-zinc-500 flex justify-between">
          {!localIsPaused && (
            <span className="flex items-center text-xs text-zinc-500">
              <span className="w-4 flex justify-center">
                <Icon
                  icon={
                    episode.progress.progress >= 1
                      ? 'material-symbols:upload'
                      : 'material-symbols:download'
                  }
                  className="text-sm mr-1"
                />
              </span>
              {episode.progress.progress >= 1
                ? prettyBytes(episode.progress.uploadSpeed)
                : prettyBytes(episode.progress.downloadSpeed)}
              /s
            </span>
          )}

          <span className={localIsPaused ? 'text-zinc-400' : 'text-zinc-500'}>
            {localIsPaused
              ? 'Pausado'
              : episode.progress.progress >= 1
              ? 'Seedeando'
              : episode.progress.remaining}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 ml-2">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          disabled={isProcessing}
          className="text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-wait h-6 w-6 min-w-0"
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
            className={`text-base ${isProcessing ? 'animate-spin' : ''}`}
          />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          className="text-zinc-400 hover:text-red-500 h-6 w-6 min-w-0"
          onClick={handleRemove}
        >
          <Icon icon="material-symbols:delete" className="text-base" />
        </Button>
      </div>
    </div>
  );
};

const EpisodesList = ({ episodes }: EpisodesListProps) => {
  const sortedEpisodes = [...episodes].sort(
    (a, b) => a.episodeInfo.episodeNumber - b.episodeInfo.episodeNumber
  );

  return (
    <div className="flex flex-col divide-y divide-zinc-800">
      {sortedEpisodes.map((episode, index) => (
        <motion.div
          key={episode.episodeId}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{
            duration: 0.2,
            delay: 0.2 + index * 0.03,
            ease: 'easeOut',
            exit: { duration: 0.1, delay: 0 },
          }}
          className="py-2 first:pt-0 last:pb-0"
        >
          <EpisodeItem episode={episode} />
        </motion.div>
      ))}
    </div>
  );
};

export default EpisodesList;
