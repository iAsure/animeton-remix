import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { debounce } from '@utils/functions';

interface SearchStore {
  searchTerm: string | null;
  setSearchTerm: (searchTerm: string) => void;
}

const useSearchStore = create<SearchStore>()(
  subscribeWithSelector((set) => ({
    searchTerm: '',
    setSearchTerm: debounce((searchTerm) => set({ searchTerm }), 500),
  }))
);

export default useSearchStore;