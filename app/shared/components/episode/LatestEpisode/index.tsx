import { useState, useEffect, memo, Fragment } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useNavigate } from '@remix-run/react';

import useRSSData from '@hooks/useRSSData';
// import useModernBackground from '@hooks/useModernBackground';
// import eventBus from '../../../lib/event-bus';
// import TorrentPlayer from '../../../lib/torrent-player';
// import { sendNotification } from '../../../lib/errors';

import EpisodeCard from './episode';
import EpisodeCardSkeleton from './skeleton';

// Types
interface Anime {
  torrent?: {
    infoHash: string;
  };
}

interface LatestEpisodesProps {
  sectionTitle?: string;
  perPage?: number;
  showViewMore?: boolean;
  viewMoreText?: string | boolean;
  cardAnimation?: boolean;
}

const LatestEpisodes: React.FC<LatestEpisodesProps> = memo(
  ({
    sectionTitle,
    perPage = 8,
    showViewMore = true,
    cardAnimation = false,
  }) => {
    const navigate = useNavigate();
    const [loadingEpisodeId, setLoadingEpisodeId] = useState<string | null>(
      null
    );

    const { rssAnimes, isLoading, error } = useRSSData({
      page: 1,
      perPage,
      emptyState: false,
    });

    // const background = useModernBackground({
    //   primaryColor: '#63e8ff',
    //   secondaryColor: '#ff9af7',
    //   disablePattern: true,
    //   opacity: 0.6
    // });

    useEffect(() => {
      if (error) {
        // sendNotification(state, { message: error });
      }
    }, [error]);

    const handlePlay = (anime: Anime) => {
      // const infoHash = anime?.torrent?.infoHash;
      // if (!infoHash) {
      //   return sendNotification(state, { message: 'Episodio no disponible.' });
      // }
      // if (loadingEpisodeId) {
      //   return sendNotification(state, { title: 'Wow, espera!', message: 'Ya estamos cargando un episodio.', type: 'alert' });
      // }
      // setLoadingEpisodeId(infoHash);
      // TorrentPlayer.playTorrent(anime, state, setLoadingEpisodeId);
    };

    const cardVariants = {
      hidden: {
        opacity: 0,
        y: 10,
        scale: 0.98,
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: 'spring',
          duration: 0.4,
          bounce: 0.1,
          staggerChildren: 0.07,
        },
      },
    };

    const renderEpisodeCard = (anime: Anime, index: number) => {
      const card = (
        <EpisodeCard
          anime={anime}
          isLoading={false}
          // isLoading={loadingEpisodeId === anime?.torrent?.infoHash}
          onPlay={() => handlePlay(anime)}
        />
      );

      return cardAnimation ? (
        <motion.div
          key={index}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            margin: '-20% 0px',
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
        {/* Background */}
        {/* <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${background})`,
          maskImage: 'linear-gradient(to top, black 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black 70%, transparent)'
        }}
      /> */}

        {sectionTitle && (
          <button
            onClick={() => navigate('/latest-episodes')}
            className="flex flex-row items-center gap-2 mb-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <Icon
              icon="majesticons:megaphone-line"
              width="28"
              height="28"
              className="pointer-events-none text-zinc-500"
            />
            <h2 className="relative text-2xl font-bold text-center text-white">
              {sectionTitle}
            </h2>
          </button>
        )}

        <div className="relative mx-auto w-full max-w-[90%]">
          <div className="grid grid-cols-4 gap-8 w-full place-items-center">
            {isLoading || !rssAnimes
              ? Array.from({ length: perPage }).map((_, i) => (
                  <EpisodeCardSkeleton key={i} />
                ))
              : rssAnimes.map((anime, i) => renderEpisodeCard(anime, i))}
          </div>

          {showViewMore && (
            <div className="flex flex-col items-center justify-center w-full">
              <button
                onClick={() => navigate('/latest-episodes')}
                className="group flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                <span className="text-xl font-semibold text-zinc-300">
                  Ver más
                </span>
                <Icon
                  icon="gravity-ui:chevron-right"
                  width="26"
                  height="26"
                  className="pointer-events-none text-zinc-500 transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default LatestEpisodes;
