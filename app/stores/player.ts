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

  // Subtitles
  availableSubtitles: any[];
  selectedSubtitleTrack: any | null;
  subtitleContent: string | null;

  // Actions
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackState: (currentTime: number, duration: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (isMuted: boolean) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setMouseMoving: (isMouseMoving: boolean) => void;
  setPlayLastAction: (action: 'play' | 'pause' | null) => void;

  // Subtitles
  setAvailableSubtitles: (subtitles: any[]) => void;
  setSelectedSubtitleTrack: (track: any | null) => void;
  setSubtitleContent: (content: string | null) => void;
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
  availableSubtitles: [],
  selectedSubtitleTrack: null,
  subtitleContent: null,

  // Actions
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackState: (currentTime, duration) => set({ currentTime, duration }),
  setVolume: (volume) => set({ volume }),
  setMuted: (isMuted) => set({ isMuted }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setMouseMoving: (isMouseMoving) => set({ isMouseMoving }),
  setPlayLastAction: (playLastAction) => set({ playLastAction }),
  setAvailableSubtitles: (availableSubtitles) => set({ availableSubtitles }),
  setSelectedSubtitleTrack: (selectedSubtitleTrack) => set({ selectedSubtitleTrack }),
  setSubtitleContent: (subtitleContent) => set({ subtitleContent }),
}));

export default usePlayerStore;
