import { create } from 'zustand';

interface PlayerStore {
  isMouseMoving: boolean;
  setIsMouseMoving: (isMouseMoving: boolean) => void;
  subtitles: string | null;
  setSubtitles: (subtitles: string | null) => void;
}

const usePlayerStore = create<PlayerStore>((set) => ({
  isMouseMoving: true,
  setIsMouseMoving: (isMouseMoving) => set({ isMouseMoving }),
  subtitles: null,
  setSubtitles: (subtitles) => set({ subtitles }),
}));

export default usePlayerStore;
