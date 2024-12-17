import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface SearchStore {
  searchTerm: string | null;
  setSearchTerm: (searchTerm: string) => void;
}

const useSearchStore = create<SearchStore>()(
  subscribeWithSelector((set) => ({
    searchTerm: '',
    setSearchTerm: (searchTerm) => set({ searchTerm }),
  }))
);

export default useSearchStore;