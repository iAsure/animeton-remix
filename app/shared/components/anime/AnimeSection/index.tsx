import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useNavigate } from '@remix-run/react';

import useAnimesData from '@hooks/useAnimesData';
import useSearchAnimes from '@hooks/useSearchAnimes';
import useModernBackground from '@hooks/useModernBackground';

import AnimeCard from './anime';
import AnimeCardSkeleton from './skeleton';

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
    viewMoreText = false,
  }) => {
    const navigate = useNavigate();
    const [filteredAnimes, setFilteredAnimes] = useState<any[]>([]);
    const {
      animes,
      isLoading: isLoadingAnimes,
      error: animesError,
    } = useAnimesData({ perPage });
    const {
      searchAnimes,
      data: searchResults,
      isLoading: isSearchLoading,
      error: searchError,
    } = useSearchAnimes(searchTerm, perPage);

    const background = useModernBackground({
      primaryColor: '#63e8ff',
      secondaryColor: '#ff9af7',
      disablePattern: true,
      opacity: 0.6,
    });

    useEffect(() => {
      const fetchAnimes = async () => {
        if (!searchTerm) {
          setFilteredAnimes(animes || []);
        } else {
          await searchAnimes();
        }
      };

      fetchAnimes();
    }, [searchTerm, animes, searchAnimes]);

    const cardVariants = {
      hidden: {
        opacity: 0,
        y: 15,
      },
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

    const renderAnimeCard = (anime, index) => {
      const card = (
        <AnimeCard key={`anime-${anime.id}-${index}`} anime={anime} />
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
        card
      );
    };

    const displayAnimes = searchTerm ? searchResults : filteredAnimes;
    const isEmpty = !displayAnimes?.length;

    const handleViewMore = () => {
      navigate('/popular-anime', { viewTransition: true });
    };

    const isLoadingContent =
      (searchTerm && isSearchLoading) || (!searchTerm && isLoadingAnimes);
    const error = searchTerm ? searchError : animesError;
    const hasError = Boolean(error);
    const hasNoResults = !isLoadingContent && !hasError && isEmpty;

    return (
      <div
        className={`relative flex flex-col p-8 px-12 ${
          isEmpty ? 'justify-center' : 'justify-start'
        } items-center ${fullScreen ? 'min-h-[calc(100vh-56px)]' : ''}`}
      >
        {/* Background */}
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

        {isLoadingContent && (
          <div
            className={`grid ${gridClassName} gap-4 sm:gap-6 md:gap-8 justify-center items-center min-h-[400px] w-full`}
          >
            {Array.from({ length: perPage }).map((_, index) => (
              <AnimeCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        )}

        {hasError && (
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
        )}

        {hasNoResults && (
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
        )}

        {!isLoadingContent && !hasError && !hasNoResults && (
          <div
            className={`grid ${gridClassName} gap-8 justify-center items-start min-h-[400px] w-full`}
          >
            {displayAnimes.map((anime, i) => renderAnimeCard(anime, i))}
          </div>
        )}

        {!isEmpty && showViewMore && (
          <div className="flex flex-col items-center justify-center w-full">
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
          </div>
        )}
      </div>
    );
  }
);

export default AnimeSection;
