import { useEffect } from 'react';

import AnimeCarousel from '@components/anime/AnimeCarousel';
// import { LatestEpisodes } from '@components/episode/LatestEpisodes';
// import { AnimeSection } from '@components/anime/AnimeSection';
import Spinner from '@components/decoration/spinner';
// import { Activation } from '@components/common/activation';

import useAnimesData from '@hooks/useAnimesData';
import LatestEpisodes from '@/shared/components/episode/LatestEpisode';
// import { useValidateKey } from '@hooks/useValidateKey';

export default function Index() {
  const animes = useAnimesData({ displayCount: 10 });

  // State-dependent code
  // const { isValid, isLoading, validateKey } = useValidateKey(state?.saved?.activation?.key);
  // const needActivation = !state?.saved?.activation?.key || (state?.saved?.activation?.key && !isValid);
  
  // useEffect(() => {
  //   if (!needActivation) {
  //     dispatch('updateDiscordRPC', { details: 'En el inicio' });
  //   }
  // }, [needActivation]);

  // useEffect(() => {
  //   if (state?.saved?.activation?.key) {
  //     validateKey();
  //   }
  // }, [state?.saved?.activation?.key, validateKey]);

  // if (isLoading) return <Spinner />;
  // if (needActivation) return <Activation isValid={isValid} />;

  if (!animes) return <Spinner />;

  return (
    <div className="dark min-h-screen bg-gray-100">
      <AnimeCarousel animes={animes} />
      {/* State-dependent components */}
      <LatestEpisodes sectionTitle={'Últimos Episodios'} />
      {/* <AnimeSection
        state={state}
        sectionTitle={'Animes Populares'}
        searchTerm={''}
        fullScreen={false}
        showViewMore={true}
      /> */}
    </div>
  );
}
