import AnimeSection from '@components/anime/AnimeSection';

import useSearchStore from '@stores/search';

const PopularAnimePage = () => {
  const { searchTerm } = useSearchStore();

  return (
    <div className='py-6'>
      <AnimeSection
        fullScreen={true}
        perPage={70}
        showBackground={true}
        cardAnimation={true}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default PopularAnimePage;

