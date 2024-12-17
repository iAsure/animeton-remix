import { useEffect } from 'react';
import useSearchStore from '@stores/search';

export const useSearchTermChange = (callback: (term: string) => void) => {
  const searchTerm = useSearchStore(state => state.searchTerm);

  useEffect(() => {
    callback(searchTerm);
  }, [searchTerm, callback]);
};