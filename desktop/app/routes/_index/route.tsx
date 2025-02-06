import { useEffect, useState } from 'react';

import useAnimesData from '@hooks/useAnimesData';
import useUserActivity from '@hooks/useUserActivity';
import useModernBackground from '@hooks/useModernBackground';

import AnimeCarousel from '@components/anime/AnimeCarousel';
import Spinner from '@components/decoration/Spinner';
import LatestEpisodes from '@components/episode/LatestEpisode';
import AnimeSection from '@components/anime/AnimeSection';
import DiscordStatus from '@components/core/DiscordStatus';
import ContinueWatching from '@components/episode/ContinueWatching';

export default function Index() {
  const { animes } = useAnimesData({ displayCount: 10 });
  const { getInProgressEpisodes } = useUserActivity();

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

  if (!animes) return <Spinner />;

  return (
    <div className="dark min-h-screen mt-14">
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
