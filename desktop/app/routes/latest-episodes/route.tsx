import LatestEpisodes from '@/shared/components/episode/LatestEpisode';

const LatestEpisodesPage = () => (
  <div className="py-6 mx-auto w-full max-w-[90%] mt-14">
    <LatestEpisodes perPage={32} showViewMore={false} cardAnimation={true} />
  </div>
);

export default LatestEpisodesPage;
