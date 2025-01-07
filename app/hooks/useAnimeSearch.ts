import { useEffect } from 'react';
import { useNavigate, useLocation } from '@remix-run/react';
import useSearchStore from '@stores/search';

const useAnimeSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchTerm, debouncedSearchTerm, setSearchTerm, resetSearch } =
    useSearchStore();

  useEffect(() => {
    if (debouncedSearchTerm && !location.pathname.includes('/popular-anime')) {
      navigate('/popular-anime', { viewTransition: true });
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const isLeavingPopularAnime = !location.pathname.includes('/popular-anime');
    const wasInPopularAnime =
      location.pathname !== '/popular-anime' && searchTerm !== '';

    if (isLeavingPopularAnime && wasInPopularAnime) {
      resetSearch();
    }
  }, [location.pathname]);

  return {
    searchTerm,
    setSearchTerm,
    resetSearch,
  };
};

export default useAnimeSearch;
