import { useEffect, useState } from 'react';

import useAnimesData from '@hooks/useAnimesData';
import useValidateKey from '@hooks/useValidateKey';
import useUserActivity from '@hooks/useUserActivity';

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
      {progressEpisodesExists && <ContinueWatching />}
      <LatestEpisodes sectionTitle={'Últimos Episodios'} perPage={progressEpisodesExists ? 4 : 8} />
      <AnimeSection
        sectionTitle={'Animes Populares'}
        searchTerm={''}
        fullScreen={false}
        showViewMore={true}
      />
    </div>
  );
}
