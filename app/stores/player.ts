import { create } from 'zustand';

interface PlayerStore {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  
  // Volume state
  volume: number;
  isMuted: boolean;
  
  // UI state
  isFullscreen: boolean;
  isMouseMoving: boolean;
  playLastAction: 'play' | 'pause' | null;
  subtitles: string | null;

  // Actions
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackState: (currentTime: number, duration: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (isMuted: boolean) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setMouseMoving: (isMouseMoving: boolean) => void;
  setPlayLastAction: (action: 'play' | 'pause' | null) => void;
  setSubtitles: (subtitles: string | null) => void;
}

const usePlayerStore = create<PlayerStore>((set) => ({
  // Initial state
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  isMouseMoving: true,
  playLastAction: null,
  subtitles: null,

  // Actions
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackState: (currentTime, duration) => set({ currentTime, duration }),
  setVolume: (volume) => set({ volume }),
  setMuted: (isMuted) => set({ isMuted }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setMouseMoving: (isMouseMoving) => set({ isMouseMoving }),
  setPlayLastAction: (playLastAction) => set({ playLastAction }),
  setSubtitles: (subtitles) => set({ subtitles }),
}));

export default usePlayerStore;
