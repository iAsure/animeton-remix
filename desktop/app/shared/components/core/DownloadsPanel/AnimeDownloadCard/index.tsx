import { formatSpeed } from '@utils/strings';
import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  onEpisodeRemoved?: (episodeId: string) => void;
}

const calculateGroupProgress = (episodes: AnimeGroup['episodes']) => {
  const totalProgress = episodes.reduce(
    (acc, episode) => acc + episode.progress.progress,
    0
  );
  return totalProgress / episodes.length;
};

const calculateGroupSpeeds = (episodes: AnimeGroup['episodes']) => {
  const speeds = episodes.reduce(
    (acc, episode) => ({
      downloadSpeed: acc.downloadSpeed + episode.progress.downloadSpeed,
      uploadSpeed: acc.uploadSpeed + episode.progress.uploadSpeed,
    }),
    { downloadSpeed: 0, uploadSpeed: 0 }
  );

  return {
    downloadSpeed: Math.max(speeds.downloadSpeed, 0),
    uploadSpeed: Math.max(speeds.uploadSpeed, 0)
  };
};

const AnimeDownloadCard = ({ animeGroup, onEpisodeRemoved }: AnimeDownloadCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localEpisodes, setLocalEpisodes] = useState<AnimeGroup['episodes']>(animeGroup.episodes);
  
  useEffect(() => {
    setLocalEpisodes(animeGroup.episodes);
  }, [animeGroup.episodes]);
  
  const handleEpisodeRemoved = (episodeId: string) => {
    const updatedEpisodes = localEpisodes.filter(ep => ep.episodeId !== episodeId);
    setLocalEpisodes(updatedEpisodes);
    
    if (onEpisodeRemoved) {
      onEpisodeRemoved(episodeId);
    }
  };
  
  const totalProgress = calculateGroupProgress(localEpisodes);
  const { downloadSpeed, uploadSpeed } = calculateGroupSpeeds(localEpisodes);
  const activeEpisodes = localEpisodes.filter(ep => !ep.progress.isPaused);
  const hasActiveDownloads = activeEpisodes.length > 0;
  
  if (localEpisodes.length === 0) {
    return null;
  }

  return (
    <div className="text-white bg-zinc-950 rounded-md hover:bg-zinc-900/50 transition-colors relative overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900">
        <div
          className={`h-full transition-all duration-300 ${
            hasActiveDownloads ? 'bg-[#ff5680]' : 'bg-zinc-500'
          }`}
          style={{
            width: `${Math.round(totalProgress * 100)}%`,
          }}
        />
      </div>

      <div className="p-2">
        <div className="flex items-center gap-2">
          <img
            src={animeGroup.animeImage}
            alt={animeGroup.animeName}
            width={50}
            height={50}
            className="aspect-square object-cover rounded-md"
          />

          <div className="flex flex-col gap-0.5 w-full min-w-0">
            <div className="font-medium min-w-0" style={{ fontSize: '13px' }}>
              <span className="block truncate">{animeGroup.animeName}</span>
            </div>
            <div className="text-xs text-zinc-400">
              {localEpisodes.length}{' '}
              {localEpisodes.length === 1 ? 'episodio' : 'episodios'}
            </div>

            {hasActiveDownloads && (
              <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                <div className="flex items-center min-w-[80px]">
                  <span className="w-4 flex justify-center">
                    <Icon icon="material-symbols:download" className="text-sm" />
                  </span>
                  <span className="ml-1">
                    {formatSpeed(downloadSpeed)}/s
                  </span>
                </div>
                <div className="flex items-center min-w-[80px]">
                  <span className="w-4 flex justify-center">
                    <Icon icon="material-symbols:upload" className="text-sm" />
                  </span>
                  <span className="ml-1">
                    {formatSpeed(uploadSpeed)}/s
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <button
              className="flex items-center justify-center h-14 w-6 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Icon
                icon="material-symbols:chevron-right"
                width={22}
                height={22}
                className={`transition-transform pointer-events-none ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
              duration: 0.2,
              ease: "easeInOut",
              exit: { duration: 0.15, delay: 0.1 }
            }}
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.1,
                delay: 0.1,
                exit: { duration: 0.1, delay: 0 }
              }}
              className="border-t border-zinc-800 bg-black/40 px-3 py-2"
            >
              <EpisodesList 
                episodes={localEpisodes} 
                onEpisodeRemoved={handleEpisodeRemoved}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimeDownloadCard;
