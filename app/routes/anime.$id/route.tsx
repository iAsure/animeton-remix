import React, { useState, useEffect, useMemo } from 'react';
import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import useExtractColor from '@hooks/useExtractColor';
import useModernBackground from '@hooks/useModernBackground';
import useCanvasRpcFrame from '@hooks/useCanvasRpcFrame';
import useAnimeDetails from '@hooks/useAnimeDetails';

import AnimeOverview from '@components/anime/AnimeOverview';
import AnimeRecommendationsList from '@components/anime/AnimeRecommendationsList';
import AnimeEpisodesList from '@components/episode/EpisodeList';
import LatestEpisodesSidebar from '@components/episode/LatestEpisodesSidebar';

import Spinner from '@components/decoration/Spinner';
import DiscordStatus from '@components/core/DiscordStatus';

interface AnimeDetailsProps {
  state: {
    window: {
      title: string;
    };
  };
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return params.id;
};

const AnimeDetails: React.FC<AnimeDetailsProps> = ({ state }) => {
  const idAnilist = useLoaderData<typeof loader>();

  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    setShowSidebar(window.innerWidth >= 1500);

    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 1500);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const anime = useAnimeDetails(idAnilist);

  const animeImage = anime?.coverImage?.extraLarge || anime?.bannerImage;
  const bannerImage = anime?.bannerImage || anime?.coverImage?.extraLarge;

  const rpcFrame = useCanvasRpcFrame({ imageUrl: animeImage }) || null;

  const { animeColors, textColor } = useExtractColor(animeImage);
  const { animeColors: bannerColors } = useExtractColor(bannerImage);

  const backgroundConfig = useMemo(
    () => ({
      primaryColor: animeColors ? animeColors[0] : '#ffffff',
      secondaryColor: bannerColors ? bannerColors[0] : '#ffffff',
      disablePattern: true,
      opacity: 0.6,
    }),
    [animeColors, bannerColors]
  );

  const background = useModernBackground(backgroundConfig);

  useEffect(() => {
    if (anime && animeColors && bannerColors) {
      setIsLoading(false);
    }
  }, [anime, animeColors, bannerColors]);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-row justify-between items-start overflow-hidden">
      <DiscordStatus
        options={{
          details: anime?.title?.romaji,
          state: 'Viendo detalles',
          assets: { large_image: rpcFrame },
        }}
      />

      <div className="relative w-full overflow-hidden">
        <AnimeOverview
          anime={anime}
          animeColors={animeColors}
          textColor={textColor}
          background={background}
        />
        <div className="flex flex-row gap-8 p-8 pt-0 justify-between items-start h-full">
          <AnimeRecommendationsList
            idAnilist={idAnilist}
            sectionTitle="Animes Similares"
          />
          <AnimeEpisodesList
            idAnilist={idAnilist}
            anime={anime}
            animeColors={animeColors}
            textColor={textColor}
            sectionTitle="Episodios"
          />
        </div>
      </div>

      {showSidebar && (
        <div className="flex-shrink-0 z-50">
          <LatestEpisodesSidebar
            state={state}
            bannerColors={bannerColors}
            sectionTitle="Episodios Recientes"
          />
        </div>
      )}
    </div>
  );
};

export default AnimeDetails;
