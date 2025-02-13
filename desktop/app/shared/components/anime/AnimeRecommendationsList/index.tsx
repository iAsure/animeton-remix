import { memo } from 'react';
import { Divider } from '@nextui-org/react';

import AnimeCard from '../AnimeSection/anime';
import AnimeCardSkeleton from '../AnimeSection/skeleton';

import useAnimeRecommendations from '@hooks/anime/useAnimeRecommendations';

interface AnimeRecommendationsListProps {
  idAnilist: number | string;
  sectionTitle: string;
}

const AnimeRecommendationsList = memo(({ idAnilist, sectionTitle }: AnimeRecommendationsListProps) => {
  const recommendations = useAnimeRecommendations(idAnilist);

  return (
    <div className="flex flex-col gap-2 items-start z-30">
      <div className="flex flex-row w-full justify-between items-start mt-2">
        <h2 className="text-2xl font-semibold">{sectionTitle}</h2>
      </div>

      <Divider orientation="horizontal" />

      <div className="flex flex-col gap-6 p-6 mt-4 bg-zinc-950 rounded-xl border-2 border-zinc-900">
        {recommendations ? (recommendations.map((anime, i) => (
          <AnimeCard
            anime={anime}
            key={`anim-recomm-${idAnilist}-${i}`}
          />
        ))) : (
          Array.from({ length: 8 }).map((_, index) => (
            <AnimeCardSkeleton key={`skeleton-${index}`} />
          ))
        )}
      </div>
    </div>
  );
});

export default AnimeRecommendationsList;
