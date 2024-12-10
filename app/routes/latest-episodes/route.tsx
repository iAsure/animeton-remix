import LatestEpisodes from '@/shared/components/episode/LatestEpisode';

const LatestEpisodesPage = () => (
  <div className="py-6 bg-black">
    <LatestEpisodes perPage={32} showViewMore={false} cardAnimation={true} />
  </div>
);

export default LatestEpisodesPage;
