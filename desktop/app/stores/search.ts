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
  subscribeWithSelector((set) => {
    const debouncedSetSearch = debounce((term: string) => {
      set({ debouncedSearchTerm: term });
    }, 750);

    return {
      searchTerm: '',
      debouncedSearchTerm: '',
      setSearchTerm: (term) => {
        const newTerm = term === null ? '' : term;
        set({ searchTerm: newTerm });
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
