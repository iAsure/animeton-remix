import { useEffect, useState } from 'react';

import useAnimesData from '@hooks/useAnimesData';
import useValidateKey from '@hooks/useValidateKey';
import useUserActivity from '@hooks/useUserActivity';
import useModernBackground from '@hooks/useModernBackground';

import AnimeCarousel from '@components/anime/AnimeCarousel';
import Spinner from '@components/decoration/Spinner';
import LatestEpisodes from '@components/episode/LatestEpisode';
import AnimeSection from '@components/anime/AnimeSection';
import Activation from '@components/core/Activation';
import DiscordStatus from '@components/core/DiscordStatus';
import ContinueWatching from '@components/episode/ContinueWatching';

import { useConfig } from '@context/ConfigContext';

export default function Index() {
  const { animes } = useAnimesData({ displayCount: 10 });
  const { config } = useConfig();
  const { getInProgressEpisodes } = useUserActivity();

  const [progressEpisodesExists, setProgressEpisodesExists] = useState(false);

  const activationKey = config?.user?.activationKey;

  const { isValid, isLoading, validateKey } = useValidateKey(activationKey);
  const needActivation =
    !activationKey || (activationKey && !isValid);

    const background = useModernBackground({
      primaryColor: '#63e8ff',
      secondaryColor: '#ff9af7',
      disablePattern: true,
      opacity: 0.6,
    });

  useEffect(() => {
    if (config?.user?.activationKey) {
      validateKey();
    }
  }, [config]);

  useEffect(() => {
    const inProgressEpisodes = getInProgressEpisodes();
    setProgressEpisodesExists(inProgressEpisodes.length > 0);
  }, [getInProgressEpisodes]);

  if (isLoading) return <Spinner />;
  if (needActivation && config) return <Activation isValid={isValid} />;
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
