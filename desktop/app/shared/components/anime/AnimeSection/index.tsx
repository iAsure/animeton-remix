import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useNavigate } from '@remix-run/react';

import useAnimesData from '@hooks/anime/useAnimesData';
import useSearchAnimes from '@hooks/anime/useSearchAnimes';
import useModernBackground from '@hooks/canvas/useModernBackground';

import AnimeCard from './anime';
import AnimeCardSkeleton from './skeleton';
import AnimeGrid from './AnimeGrid';

interface AnimeSectionProps {
  sectionTitle?: string;
  searchTerm?: string;
  fullScreen?: boolean;
  perPage?: number;
  showBackground?: boolean;
  cardAnimation?: boolean;
  gridClassName?: string;
  showViewMore?: boolean;
  viewMoreText?: string;
}

const AnimeSection: React.FC<AnimeSectionProps> = React.memo(
  ({
    sectionTitle,
    searchTerm,
    fullScreen = false,
    perPage = 28,
    showBackground = false,
    cardAnimation = false,
    gridClassName = 'grid-cols-auto-fit',
    showViewMore = false,
  }) => {
    const navigate = useNavigate();
    const [displayMode, setDisplayMode] = useState<'popular' | 'search'>(
      'popular'
    );

    const {
      animes: popularAnimes,
      isLoading: isLoadingPopular,
      error: popularError,
    } = useAnimesData({ perPage });

    const {
      searchAnimes,
      data: searchResults,
      isLoading: isSearching,
      error: searchError,
    } = useSearchAnimes(searchTerm, perPage);

    const background = useModernBackground({
      primaryColor: '#63e8ff',
      secondaryColor: '#ff9af7',
      disablePattern: true,
      opacity: 0.6,
    });

    useEffect(() => {
      if (searchTerm) {
        setDisplayMode('search');
        searchAnimes();
      } else {
        setDisplayMode('popular');
      }
    }, [searchTerm, searchAnimes]);

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

    const renderAnimeCard = (anime: any, index: number) => {
      const card = (
        <AnimeCard key={`anime-${anime.id}-${index}`} anime={anime} />
      );

      return cardAnimation ? (
        <motion.div
          key={index}
          initial="hidden"
          whileInView={{ 
            opacity: 1,
            y: 0,
            transition: {
              type: 'spring',
              duration: 0.3,
              bounce: 0.1
            }
          }}
          viewport={{ once: true, margin: '-1% 0px', amount: 0.1 }}
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
        card
      );
    };

    const handleViewMore = () =>
      navigate('/popular-anime', { viewTransition: true });

    const renderContent = () => {
      const isLoading =
        displayMode === 'search'
          ? isSearching || (searchTerm && !searchResults.length)
          : isLoadingPopular;
      const error = displayMode === 'search' ? searchError : popularError;
      const animes = displayMode === 'search' ? searchResults : popularAnimes;
      const isEmpty = !animes?.length;

      if (isLoading) {
        return (
          <AnimeGrid className={gridClassName}>
            {Array.from({ length: perPage }).map((_, index) => (
              <AnimeCardSkeleton key={`skeleton-${index}`} />
            ))}
          </AnimeGrid>
        );
      }

      if (error) {
        return (
          <div className="flex flex-col justify-center items-center w-full min-h-[400px]">
            <Icon
              icon="gravity-ui:circle-xmark"
              width="128"
              height="128"
              className="text-zinc-500"
            />
            <p className="text-2xl font-bold text-zinc-500">
              {error || 'Ha ocurrido un error'}
            </p>
          </div>
        );
      }

      if (isEmpty && displayMode === 'search') {
        return (
          <div className="flex flex-col justify-center items-center w-full min-h-[400px]">
            <Icon
              icon="gravity-ui:circle-xmark"
              width="128"
              height="128"
              className="text-zinc-500"
            />
            <p className="text-2xl font-bold text-zinc-500">
              No se encontraron animes
            </p>
          </div>
        );
      }

      return (
        <AnimeGrid className={gridClassName}>
          {animes.map((anime, i) => renderAnimeCard(anime, i))}
        </AnimeGrid>
      );
    };

    return (
      <div
        className={`relative flex flex-col p-8 px-12 items-center ${
          fullScreen ? 'min-h-[calc(100vh-56px)]' : ''
        }`}
      >
        {showBackground && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${background})`,
              maskImage: 'linear-gradient(to top, black 70%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to top, black 70%, transparent)',
            }}
          />
        )}

        {sectionTitle && (
          <button
            onClick={handleViewMore}
            className="flex flex-row items-center gap-2 mb-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <Icon
              icon="gravity-ui:star"
              width="28"
              height="28"
              className="pointer-events-none text-zinc-500"
            />
            <h2 className="relative text-2xl font-bold text-center z-10 text-white">
              {sectionTitle}
            </h2>
          </button>
        )}

        {renderContent()}

        {showViewMore && popularAnimes?.length > 0 && (
          <button
            onClick={handleViewMore}
            className="group flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300"
          >
            <span className="text-xl font-semibold text-white">Ver más</span>
            <Icon
              icon="gravity-ui:chevron-right"
              width="26"
              height="26"
              className="pointer-events-none transition-transform duration-300 group-hover:translate-x-1 text-zinc-500"
            />
          </button>
        )}
      </div>
    );
  }
);

export default AnimeSection;
