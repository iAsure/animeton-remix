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
  subscribeWithSelector((set) => ({
    searchTerm: '',
    debouncedSearchTerm: '',
    setSearchTerm: (term) => {
      const newTerm = term === null ? '' : term;
      set({ searchTerm: newTerm });
      debouncedSetSearch(newTerm, set);
    },
    resetSearch: () => {
      set({
        searchTerm: '',
        debouncedSearchTerm: '',
      });
      debouncedSetSearch.cancel();
    },
  }))
);

const debouncedSetSearch = debounce((term: string, set) => {
  set({ debouncedSearchTerm: term });
}, 500);

export default useSearchStore;
