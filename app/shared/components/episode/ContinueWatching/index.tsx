import { memo, Fragment } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import useUserActivity from '@hooks/useUserActivity';

import { useTorrentPlayer } from '@context/TorrentPlayerContext';

import EpisodeCard from '../LatestEpisode/episode';

interface ContinueWatchingProps {
  sectionTitle?: string;
  perPage?: number;
  cardAnimation?: boolean;
}

const ContinueWatching = memo(
  ({
    sectionTitle = 'Seguir Viendo',
    perPage = 4,
    cardAnimation = false,
  }: ContinueWatchingProps) => {
    const { playEpisode, loadingHash } = useTorrentPlayer();
    const { getInProgressEpisodes } = useUserActivity();

    const inProgressEpisodes = getInProgressEpisodes();

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

    const renderEpisodeCard = (episode, index: number) => {
      const progress = episode?.progressData?.progress;

      const card = (
        <EpisodeCard
          anime={null}
          episode={episode}
          isLoading={loadingHash === episode.episodeId}
          onPlay={() => playEpisode(episode)}
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
            margin: '-1% 0px',
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
      <div className="flex flex-col items-center py-6">
        {sectionTitle && (
          <button className="flex flex-row items-center gap-2 mb-6 transition-transform duration-300 hover:-translate-y-1">
            <Icon
              icon="material-symbols:play-circle-outline"
              width="28"
              height="28"
              className="pointer-events-none text-zinc-500"
            />
            <h2 className="text-2xl font-bold text-center text-white">
              {sectionTitle}
            </h2>
          </button>
        )}

        <div className="w-[90%]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full">
            {inProgressEpisodes
              .slice(0, perPage)
              .map((episode, i) => renderEpisodeCard(episode, i))}
          </div>
        </div>
      </div>
    );
  }
);

export default ContinueWatching;
