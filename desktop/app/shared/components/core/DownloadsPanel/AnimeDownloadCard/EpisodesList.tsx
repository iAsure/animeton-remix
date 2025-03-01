import { Button, Tooltip } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useState, useEffect, memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatSpeed } from '@utils/strings';
import useDownloads from '@hooks/user/useDownloads';

interface EpisodeProgress {
  isPaused?: boolean;
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
  status: 'downloading' | 'paused' | 'completed';
}

interface EpisodeItemProps {
  episode: Episode;
  onEpisodeRemoved?: (episodeId: string) => void;
}

interface EpisodesListProps {
  episodes: Episode[];
  onEpisodeRemoved?: (episodeId: string) => void;
}

const EpisodeItem = memo(({ episode, onEpisodeRemoved }: EpisodeItemProps) => {
  const { pauseResume, isResumingTorrent, getResumeError, cancelResume } =
    useDownloads();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [localResuming, setLocalResuming] = useState(false);
  const lastPausedState = useRef(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isPaused = episode.status === 'paused' || episode.progress?.isPaused;
  const isResuming = episode.torrentHash
    ? isResumingTorrent(episode.torrentHash)
    : false;
  const resumeError = episode.torrentHash
    ? getResumeError(episode.torrentHash)
    : null;
  const hasError = !!resumeError;

  useEffect(() => {
    if (isResuming && !localResuming) {
      setLocalResuming(true);
    }
  }, [isResuming, localResuming]);

  useEffect(() => {
    if (isPaused !== lastPausedState.current) {
      lastPausedState.current = isPaused;
    }
  }, [isPaused]);

  useEffect(() => {
    if (!isResuming && localResuming) {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }

      resumeTimerRef.current = setTimeout(() => {
        setLocalResuming(false);
      }, 1000); 

      return () => {
        if (resumeTimerRef.current) {
          clearTimeout(resumeTimerRef.current);
        }
      };
    }

    if (hasError && localResuming) {
      setLocalResuming(false);
    }
  }, [isResuming, localResuming, hasError]);

  useEffect(() => {
    setIsProcessing(false);
  }, [isPaused, isResuming, resumeError]);

  const handlePauseResume = async () => {
    if (!episode.torrentHash || !episode.episodeInfo?.episodeTorrentUrl) return;

    if (hasError) {
      cancelResume(episode.torrentHash);
      return;
    }

    if (isProcessing || isResuming) {
      return;
    }

    setIsProcessing(true);

    if (isPaused) {
      setLocalResuming(true);
    }

    try {
      const result = await pauseResume(
        episode.torrentHash,
        episode.episodeInfo.episodeTorrentUrl
      );

      if (isPaused && !result.isPaused) {
      } else {
        if (!isPaused && result.isPaused) {
          setLocalResuming(false);
        }
      }
    } catch (error) {
      console.error('Error al cambiar estado del torrent:', error);
      setIsProcessing(false);

      if (isPaused) {
        setLocalResuming(false);
      }
    }
  };

  const handleRemove = async () => {
    if (!episode.torrentHash) {
      console.error('Missing torrent hash for remove');
      return;
    }

    try {
      setIsRemoving(true);

      await window.api.torrent.remove(episode.torrentHash);

      if (onEpisodeRemoved && episode.episodeId) {
        onEpisodeRemoved(episode.episodeId);
      }
    } catch (error) {
      console.error('Error al eliminar torrent:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const progress =
    typeof episode.progress?.progress === 'number'
      ? Math.max(0, Math.min(1, episode.progress.progress))
      : 0;

  const showLoading = isProcessing || isResuming || localResuming;
  const showResumingUI = (isResuming || localResuming) && !hasError;

  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex flex-col justify-between w-full h-full">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-zinc-300" style={{ fontSize: '13px' }}>
            Episodio {episode.episodeInfo?.episodeNumber || '?'}
          </span>
          <span className={isPaused ? 'text-zinc-400' : 'text-zinc-500'}>
            {Math.round(progress * 100)}%
          </span>
        </div>

        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isPaused && !showResumingUI
                ? hasError
                  ? 'bg-red-500'
                  : 'bg-zinc-500'
                : showResumingUI
                ? 'bg-zinc-600'
                : 'bg-[#ff5680]'
            }`}
            style={{
              width: `${Math.round(progress * 100)}%`,
            }}
          />
        </div>

        <div className="mt-1 text-xs text-zinc-500 flex justify-between">
          {!isPaused && !showResumingUI && !hasError && (
            <span className="flex items-center text-xs text-zinc-500">
              <span className="w-4 flex justify-center">
                <Icon
                  icon={
                    progress >= 1
                      ? 'material-symbols:upload'
                      : 'material-symbols:download'
                  }
                  className="text-sm mr-1"
                />
              </span>
              {progress >= 1
                ? formatSpeed(episode.progress?.uploadSpeed || 0)
                : formatSpeed(episode.progress?.downloadSpeed || 0)}
              /s
            </span>
          )}

          {showResumingUI && (
            <span className="flex items-center text-xs text-zinc-400">
              Reanudando...
            </span>
          )}

          {hasError && (
            <Tooltip content={resumeError} placement="bottom">
              <span className="flex items-center text-xs text-red-500">
                <span className="w-4 flex justify-center">
                  <Icon
                    icon="material-symbols:error"
                    className="text-sm mr-1"
                  />
                </span>
                Error al reanudar
              </span>
            </Tooltip>
          )}

          <span
            className={
              isPaused && !showResumingUI
                ? hasError
                  ? 'text-red-400'
                  : 'text-zinc-400'
                : 'text-zinc-500'
            }
          >
            {isPaused && !showResumingUI
              ? hasError
                ? 'Falló al reanudar'
                : 'Pausado'
              : showResumingUI
              ? 'Conectando...'
              : progress >= 1
              ? 'Seedeando'
              : episode.progress?.remaining || 'Calculando...'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 ml-2">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          disabled={showLoading}
          className={`${
            hasError
              ? 'text-red-500 hover:text-red-400'
              : showLoading
              ? 'opacity-50 cursor-wait'
              : 'text-zinc-400 hover:text-white'
          } h-6 w-6 min-w-0`}
          onClick={handlePauseResume}
        >
          <Icon
            icon={
              showLoading
                ? 'mdi:loading'
                : hasError
                ? 'material-symbols:refresh'
                : isPaused && !showResumingUI
                ? 'material-symbols:play-arrow'
                : 'material-symbols:pause'
            }
            className={`text-base ${showLoading ? 'animate-spin' : ''}`}
          />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          disabled={isRemoving || showResumingUI || isProcessing}
          className="text-zinc-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-wait h-6 w-6 min-w-0"
          onClick={handleRemove}
        >
          <Icon
            icon={isRemoving ? 'mdi:loading' : 'material-symbols:delete'}
            className={`text-base ${isRemoving ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>
    </div>
  );
});

const EpisodesList = memo(
  ({ episodes, onEpisodeRemoved }: EpisodesListProps) => {
    const validEpisodes = episodes.filter(
      (episode) => episode && episode.episodeId && episode.torrentHash
    );

    const sortedEpisodes = [...validEpisodes].sort(
      (a, b) =>
        (a.episodeInfo?.episodeNumber || 0) -
        (b.episodeInfo?.episodeNumber || 0)
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
            <EpisodeItem
              episode={episode}
              onEpisodeRemoved={onEpisodeRemoved}
            />
          </motion.div>
        ))}
      </div>
    );
  }
);

export default EpisodesList;
