import { useEffect, useState } from 'react';

import useAnimesData from '@hooks/useAnimesData';
import useValidateKey from '@hooks/useValidateKey';
import useUserActivity from '@hooks/useUserActivity';
import useModernBackground from '@hooks/useModernBackground';

import AnimeCarousel from '@components/anime/AnimeCarousel';
import Spinner from '@components/decoration/Spinner';
import LatestEpisodes from '@components/episode/LatestEpisode';
import AnimeSection from '@components/anime/AnimeSection';
import DiscordStatus from '@components/core/DiscordStatus';
import ContinueWatching from '@components/episode/ContinueWatching';
import ErrorDisplay from '@components/core/ErrorDisplay';

import { useConfig } from '@context/ConfigContext';

export default function Index() {
  const { animes } = useAnimesData({ displayCount: 10 });
  const { config } = useConfig();
  const { getInProgressEpisodes } = useUserActivity();
  const [hasTimeout, setHasTimeout] = useState(false);

  const [progressEpisodesExists, setProgressEpisodesExists] = useState(false);

    const background = useModernBackground({
      primaryColor: '#63e8ff',
      secondaryColor: '#ff9af7',
      disablePattern: true,
      opacity: 0.6,
    });

  useEffect(() => {
    const inProgressEpisodes = getInProgressEpisodes();
    setProgressEpisodesExists(inProgressEpisodes.length > 0);
  }, [getInProgressEpisodes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!animes) {
        setHasTimeout(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [animes]);

  if (hasTimeout) {
    return (
      <ErrorDisplay 
        message="Error de conexión. Intenta de nuevo más tarde."
        icon="fluent:wifi-warning-24-filled"
      />
    );
  }

  if (!animes) return <Spinner />;

  return (
    <div className="dark min-h-screen">
      <DiscordStatus options={{ details: 'En el inicio' }} />
      <AnimeCarousel animes={animes} />
      
      <div className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${background})`,
            maskImage: 'linear-gradient(to top, black 70%, transparent)',
            WebkitMaskImage: 'linear-gradient(to top, black 70%, transparent)',
          }}
        />
        
        <div className="relative">
          {progressEpisodesExists && <ContinueWatching perPage={4} />}
          <LatestEpisodes 
            sectionTitle={'Últimos Episodios'} 
            perPage={progressEpisodesExists ? 4 : 8}
          />
        </div>
      </div>

      <AnimeSection
        sectionTitle={'Animes Populares'}
        searchTerm={''}
        fullScreen={false}
        showViewMore={true}
      />
    </div>
  );
}
