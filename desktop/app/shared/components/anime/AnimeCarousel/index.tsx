import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { translateGenres } from '@utils/strings';
import { Anime } from '@shared/types/anime';

interface AnimeCarouselProps {
  animes: Anime[];
}

const AnimeCarousel: React.FC<AnimeCarouselProps> = ({ animes }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isUserInteraction, setIsUserInteraction] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => {
        handleNext(false);
      },
      isUserInteraction ? 15000 : 10000
    );

    return () => clearInterval(interval);
  }, [currentIndex, isUserInteraction]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? animes.length - 1 : prevIndex - 1
    );
    setIsUserInteraction(true);
  };

  const handleNext = (isUser = true) => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % animes.length);
    setIsUserInteraction(isUser);
  };

  const currentAnime = animes[currentIndex];
  const animeImage =
    currentAnime?.bannerImage || currentAnime?.coverImage?.extraLarge;

  const slideVariants = {
    enter: {
      opacity: 0,
    },
    center: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  };

  const handleAnimeClick = (anime) => {
    navigate(`/anime/${anime?.idAnilist}`, { viewTransition: true });
  };

  return (
    <div className="relative w-full h-[480px] overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { duration: 0.5 },
          }}
          className="absolute inset-0"
        >
          <img
            src={animeImage}
            alt="Anime background"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              maskImage: 'linear-gradient(to bottom, black 90%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to bottom, black 90%, transparent)',
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 p-12">
            <div className="relative h-full flex flex-row justify-center items-center gap-8 text-white py-12">
              <div className="flex flex-col justify-between max-w-[60%] h-full">
                <div className="flex flex-col gap-2">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-5xl font-bold text-left w-full"
                  >
                    {currentAnime?.title?.romaji}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="flex gap-2"
                  >
                    {translateGenres(currentAnime?.genres).map(
                      (genre, index) => (
                        <span
                          key={index}
                          className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm"
                        >
                          {genre}
                        </span>
                      )
                    )}
                  </motion.div>
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-lg text-left"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {currentAnime?.description}
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                  onClick={() => handleAnimeClick(currentAnime)}
                  className="relative text-center flex justify-center items-center rounded-full px-8 py-3 bg-white text-black font-bold cursor-pointer hover:bg-opacity-90 transition-all duration-300 w-40"
                >
                  Ver más
                </motion.button>
              </div>
              <div className="w-52 h-full" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <button
        className="absolute left-0 top-1/2 transform -translate-y-1/2 text-4xl px-4 h-full group"
        onClick={handlePrev}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-50" />
        <Icon
          className="relative pointer-events-none text-white opacity-30 group-hover:opacity-100 transition-opacity duration-300"
          icon="gravity-ui:chevron-left"
          width="72"
          height="72"
        />
      </button>
      <button
        className="absolute right-0 top-1/2 transform -translate-y-1/2 text-4xl px-4 h-full group"
        onClick={() => handleNext(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-black to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-50" />
        <Icon
          className="relative pointer-events-none text-white opacity-30 group-hover:opacity-100 transition-opacity duration-300"
          icon="gravity-ui:chevron-right"
          width="72"
          height="72"
        />
      </button>
    </div>
  );
};

export default AnimeCarousel;
