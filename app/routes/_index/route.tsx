import { useEffect } from 'react';

import useAnimesData from '@hooks/useAnimesData';
import useValidateKey from '@hooks/useValidateKey';

import AnimeCarousel from '@components/anime/AnimeCarousel';
import Spinner from '@components/decoration/Spinner';
import LatestEpisodes from '@components/episode/LatestEpisode';
import AnimeSection from '@components/anime/AnimeSection';
import Activation from '@components/core/Activation';

import { useConfig } from '@context/ConfigContext';

export default function Index() {
  const { animes } = useAnimesData({ displayCount: 10 });
  const { config } = useConfig();

  const activationKey = config?.user?.activationKey;

  const { isValid, isLoading, validateKey } = useValidateKey(activationKey);
  const needActivation =
    activationKey === undefined || (activationKey && !isValid);

  // useEffect(() => {
  //   if (!needActivation) {
  //     dispatch('updateDiscordRPC', { details: 'En el inicio' });
  //   }
  // }, [needActivation]);

  useEffect(() => {
    if (config?.user?.activationKey) {
      validateKey();
    }
  }, [config]);

  if (isLoading) return <Spinner />;
  if (needActivation && config) return <Activation isValid={isValid} />;

  if (!animes) return <Spinner />;

  return (
    <div className="dark min-h-screen">
      <AnimeCarousel animes={animes} />
      <LatestEpisodes sectionTitle={'Últimos Episodios'} />
      <AnimeSection
        sectionTitle={'Animes Populares'}
        searchTerm={''}
        fullScreen={false}
        showViewMore={true}
      />
    </div>
  );
}
