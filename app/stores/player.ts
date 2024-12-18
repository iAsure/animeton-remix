import { create } from 'zustand';

interface SubtitleRange {
  start: number;
  end: number;
}

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

  // Subtitle ranges
  subtitleRanges: SubtitleRange[];

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

  // Subtitle ranges
  updateSubtitleRanges: () => void;
}

const usePlayerStore = create<PlayerStore>((set, get) => ({
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
  subtitleRanges: [],

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

  updateSubtitleRanges: () => {
    const { subtitleContent, duration } = get();
    if (!subtitleContent || !duration) {
      set({ subtitleRanges: [] });
      return;
    }

    // Parse ASS subtitles to extract timestamp ranges
    const ranges: SubtitleRange[] = [];
    const lines = subtitleContent.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('Dialogue:')) {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const start = parseAssTimestamp(parts[1]);
          const end = parseAssTimestamp(parts[2]);
          
          if (start !== null && end !== null) {
            ranges.push({ start, end });
          }
        }
      }
    }

    // Merge overlapping ranges
    const mergedRanges = mergeTimeRanges(ranges);
    set({ subtitleRanges: mergedRanges });
  },
}));

// Helper functions
function parseAssTimestamp(timestamp: string): number | null {
  const match = timestamp.trim().match(/(\d+):(\d+):(\d+)\.(\d+)/);
  if (!match) return null;
  
  const [_, hours, minutes, seconds, centiseconds] = match;
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds) +
    parseInt(centiseconds) / 100
  );
}

function mergeTimeRanges(ranges: SubtitleRange[]): SubtitleRange[] {
  if (ranges.length === 0) return [];
  
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: SubtitleRange[] = [sorted[0]];

  for (const range of sorted.slice(1)) {
    const last = merged[merged.length - 1];
    if (range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push(range);
    }
  }

  return merged;
}

export default usePlayerStore;
