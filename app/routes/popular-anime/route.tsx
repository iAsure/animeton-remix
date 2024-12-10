import { useState, useEffect } from 'react';
import { useLocation } from '@remix-run/react';

import AnimeSection from '@components/anime/AnimeSection';

const PopularAnimePage = ({ state }) => {
//   const location = useLocation();
//   const [searchTerm, setSearchTerm] = useState('');

//   // Handle initial state and location changes
//   useEffect(() => {
//     if (location.state?.searchTerm) {
//       setSearchTerm(location.state.searchTerm);
//       eventBus.emit('searchTermChanged', location.state.searchTerm);
//     }
//   }, [location.state?.searchTerm]);

//   // Handle search term changes
//   useEffect(() => {
//     const handleSearch = (term) => setSearchTerm(term);
//     eventBus.on('searchTermChanged', handleSearch);
    
//     return () => eventBus.off('searchTermChanged', handleSearch);
//   }, []);

  return (
    <div className='py-6 bg-black'>
      <AnimeSection
        fullScreen={true}
        perPage={70}
        showBackground={true}
        cardAnimation={true}
        // searchTerm={searchTerm}
      />
    </div>
  );
};

export default PopularAnimePage;

