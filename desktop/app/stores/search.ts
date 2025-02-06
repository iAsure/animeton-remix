import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { debounce } from '@utils/functions';

interface SearchStore {
  searchTerm: string;
  debouncedSearchTerm: string;
  setSearchTerm: (term: string | null) => void;
  resetSearch: () => void;
}

const useSearchStore = create<SearchStore>()(
  subscribeWithSelector((set, get) => {
    const debouncedSetSearch = debounce((term: string) => {
      set({ 
        searchTerm: term,
        debouncedSearchTerm: term 
      });
    }, 500);

    return {
      searchTerm: '',
      debouncedSearchTerm: '',
      setSearchTerm: (term) => {
        const newTerm = term === null ? '' : term;
        debouncedSetSearch(newTerm);
      },
      resetSearch: () => {
        set({
          searchTerm: '',
          debouncedSearchTerm: '',
        });
        debouncedSetSearch.cancel();
      },
    };
  })
);

export default useSearchStore;
