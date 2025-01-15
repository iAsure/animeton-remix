import { memo, Fragment } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import useRSSData from '@hooks/useRSSData';
import useModernBackground from '@hooks/useModernBackground';
import useUserActivity from '@hooks/useUserActivity';

import { useTorrentPlayer } from '@context/TorrentPlayerContext';

import EpisodeCard from '../LatestEpisode/episode';
import EpisodeCardSkeleton from '../LatestEpisode/skeleton';

interface ContinueWatchingProps {
  sectionTitle?: string;
  perPage?: number;
  cardAnimation?: boolean;
}

const ContinueWatching = memo(({
  sectionTitle = 'Seguir Viendo',
  perPage = 4,
  cardAnimation = false,
}: ContinueWatchingProps) => {
  const { playEpisode, loadingHash } = useTorrentPlayer();
  const { history, getInProgressEpisodes } = useUserActivity();
  const { rssAnimes, isLoading } = useRSSData({
    page: 1,
    perPage: 50,
    emptyState: false,
  });

  const background = useModernBackground({
    primaryColor: '#ff9af7',
    secondaryColor: '#63e8ff',
    disablePattern: true,
    opacity: 0.6,
  });

  const inProgressEpisodes = getInProgressEpisodes();
  
  const filteredAnimes = rssAnimes?.filter(anime => 
    inProgressEpisodes.some(episode => 
      episode.episodeId === anime.torrent.infoHash
    )
  ).slice(0, perPage);

  if (!filteredAnimes?.length) return null;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        duration: 0.3,
        bounce: 0.1,
        staggerChildren: 0.03,
      },
    },
  };

  const renderEpisodeCard = (anime, index: number) => {
    const progress = history?.episodes[anime?.torrent?.infoHash]?.progress;

    const card = (
      <EpisodeCard
        anime={anime}
        isLoading={loadingHash === anime?.torrent?.infoHash}
        onPlay={() => playEpisode(anime)}
        progress={progress}
      />
    );

    return cardAnimation ? (
      <motion.div
        key={index}
        initial="hidden"
        whileInView="visible"
        viewport={{
          once: true,
          margin: '-10% 0px',
          amount: 0.1,
        }}
        variants={cardVariants}
        className="will-change-transform"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {card}
      </motion.div>
    ) : (
      <Fragment key={index}>{card}</Fragment>
    );
  };

  return (
    <div className="relative flex flex-col items-center py-6">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${background})`,
          maskImage: 'linear-gradient(to top, black 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black 70%, transparent)',
        }}
      />

      {sectionTitle && (
        <div className="flex flex-row items-center gap-2 mb-6">
          <Icon
            icon="material-symbols:play-circle-outline"
            width="28"
            height="28"
            className="pointer-events-none text-zinc-500"
          />
          <h2 className="relative text-2xl font-bold text-center text-white">
            {sectionTitle}
          </h2>
        </div>
      )}

      <div className="relative mx-auto max-w-[90%]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full">
          {isLoading
            ? Array.from({ length: perPage }).map((_, i) => (
                <EpisodeCardSkeleton key={i} />
              ))
            : filteredAnimes.map((anime, i) => renderEpisodeCard(anime, i))}
        </div>
      </div>
    </div>
  );
});

export default ContinueWatching;