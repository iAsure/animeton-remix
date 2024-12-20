import { create } from 'zustand';

interface SubtitleRange {
  start: number;
  end: number;
}

interface SubtitleStatus {
  status: 'idle' | 'loading' | 'ready' | 'error';
  message?: string;
}

// Add ExtractionState interface
interface ExtractionState {
  status: 'idle' | 'extracting' | 'retrying' | 'completed' | 'error';
  error?: string;
  attempts: number;
  progress?: number;
  lastAttemptTime?: number;
  successfulTracks?: number;
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
  subtitleStatus: SubtitleStatus;

  // Subtitle ranges
  subtitleRanges: SubtitleRange[];

  // Add new subtitle extraction states
  consecutiveMatches: number;
  videoFilePath: string | null;
  extractionState: ExtractionState;
  lastSegmentCount: number | null;

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
  setSubtitleStatus: (status: SubtitleStatus) => void;

  // Subtitle ranges
  updateSubtitleRanges: () => void;

  // Add reset action
  reset: () => void;

  // Add new actions
  setConsecutiveMatches: (valueOrFn: number | ((prev: number) => number)) => void;
  setVideoFilePath: (path: string | null) => void;
  setExtractionState: (stateOrFn: ExtractionState | ((prev: ExtractionState) => ExtractionState)) => void;
  setLastSegmentCount: (count: number | null) => void;
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
  subtitleStatus: { status: 'idle' },

  // Add new initial states
  consecutiveMatches: 0,
  videoFilePath: null,
  extractionState: {
    status: 'idle',
    attempts: 0
  },
  lastSegmentCount: null,

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
  setSubtitleStatus: (status) => set({ subtitleStatus: status }),

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

  reset: () => set({
    // Playback state
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    
    // Volume state
    volume: 1,
    isMuted: false,
    
    // UI state
    isFullscreen: false,
    isMouseMoving: true,
    playLastAction: null,

    // Subtitles state
    availableSubtitles: [],
    selectedSubtitleTrack: null,
    subtitleContent: null,
    subtitleRanges: [],
    subtitleStatus: { status: 'idle' },

    // Extraction state
    consecutiveMatches: 0,
    videoFilePath: null,
    extractionState: {
      status: 'idle',
      attempts: 0,
      error: undefined,
      progress: undefined,
      lastAttemptTime: undefined,
      successfulTracks: undefined
    },
    lastSegmentCount: null
  }),

  // Add new actions
  setConsecutiveMatches: (valueOrFn: number | ((prev: number) => number)) => 
    set((state) => ({
      consecutiveMatches: typeof valueOrFn === 'function' 
        ? valueOrFn(state.consecutiveMatches)
        : valueOrFn
    })),
  setVideoFilePath: (path) => set({ videoFilePath: path }),
  setExtractionState: (stateOrFn) => set((state) => ({
    extractionState: typeof stateOrFn === 'function' 
      ? stateOrFn(state.extractionState)
      : stateOrFn
  })),
  setLastSegmentCount: (count) => set({ lastSegmentCount: count }),
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
