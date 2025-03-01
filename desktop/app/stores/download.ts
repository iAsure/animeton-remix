import { create } from 'zustand';

interface TorrentProgress {
  numPeers: number;
  downloaded: number;
  total: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  remaining: string;
  isBuffering: boolean;
  ready: boolean;
  completed: boolean;
  isPaused?: boolean;
}

interface EpisodeInfo {
  animeName: string;
  animeImage: string;
  animeIdAnilist: number;
  episodeImage: string;
  episodeNumber: number;
  episodeTorrentUrl: string;
  pubDate: string;
}

export interface Download {
  episodeId: string;
  torrentHash: string;
  progress: TorrentProgress;
  episodeInfo: EpisodeInfo;
  status: 'downloading' | 'paused' | 'completed';
}

interface ActiveTorrent {
  infoHash: string;
  name: string;
  created: number;
  progress: TorrentProgress;
}

interface DownloadsState {
  downloads: Download[];
  pausedDownloads: Record<string, Download>;
  
  setDownloads: (downloads: Download[]) => void;
  updateDownload: (episodeId: string, updates: Partial<Download>) => void;
  pauseDownload: (download: Download) => void;
  resumeDownload: (download: Download) => void;
  removeDownload: (episodeId: string) => void;
  
  syncWithActiveTorrents: (activeTorrents: ActiveTorrent[], historyEpisodes: Record<string, any>) => void;
}

const useDownloadsStore = create<DownloadsState>((set) => ({
  downloads: [],
  pausedDownloads: {},
  
  setDownloads: (downloads) => set({ downloads }),
  
  updateDownload: (episodeId, updates) => {
    set((state) => {
      const updatedDownloads = state.downloads.map(download => 
        download.episodeId === episodeId 
          ? { ...download, ...updates } 
          : download
      );
      
      return { downloads: updatedDownloads };
    });
  },
  
  pauseDownload: (download) => {
    set((state) => {
      // Create a paused version of the download
      const pausedDownload = {
        ...download,
        progress: {
          ...download.progress,
          isPaused: true,
          downloadSpeed: 0,
          uploadSpeed: 0
        },
        status: 'paused' as const
      };
      
      // Remove from active downloads if it exists there
      const filteredDownloads = state.downloads.filter(d => 
        d.episodeId !== download.episodeId
      );
      
      // Add to paused downloads
      return {
        downloads: filteredDownloads,
        pausedDownloads: {
          ...state.pausedDownloads,
          [download.episodeId]: pausedDownload
        }
      };
    });
  },
  
  resumeDownload: (download) => {
    set((state) => {
      // Create a resumed version of the download
      const resumedDownload = {
        ...download,
        progress: {
          ...download.progress,
          isPaused: false
        },
        status: 'downloading' as const
      };
      
      // Remove from paused downloads
      const newPausedDownloads = { ...state.pausedDownloads };
      delete newPausedDownloads[download.episodeId];
      
      // Add to active downloads if not already there
      const downloadExists = state.downloads.some(d => d.episodeId === download.episodeId);
      const updatedDownloads = downloadExists
        ? state.downloads.map(d => d.episodeId === download.episodeId ? resumedDownload : d)
        : [...state.downloads, resumedDownload];
      
      return { 
        downloads: updatedDownloads,
        pausedDownloads: newPausedDownloads
      };
    });
  },
  
  removeDownload: (episodeId) => {
    set((state) => {
      const newDownloads = state.downloads.filter(d => d.episodeId !== episodeId);
      const newPausedDownloads = { ...state.pausedDownloads };
      delete newPausedDownloads[episodeId];
      
      return { 
        downloads: newDownloads,
        pausedDownloads: newPausedDownloads
      };
    });
  },
  
  syncWithActiveTorrents: (activeTorrents, historyEpisodes) => {
    set((state) => {
      if (!activeTorrents || !historyEpisodes) return state;
      
      const validActiveTorrents = activeTorrents.filter(torrent => torrent && torrent.infoHash);
      const activeTorrentsMap = new Map(
        validActiveTorrents.map(torrent => [torrent.infoHash.toLowerCase(), torrent])
      );
      
      // Get all episode IDs that are currently paused
      const pausedEpisodeIds = new Set(Object.keys(state.pausedDownloads));
      
      // Create new downloads from active torrents, excluding paused ones
      const newDownloads = Object.entries(historyEpisodes)
        .filter(([episodeId]) => {
          // Only include if it's in active torrents AND not paused
          return episodeId && 
                 activeTorrentsMap.has(episodeId.toLowerCase()) && 
                 !pausedEpisodeIds.has(episodeId);
        })
        .map(([episodeId, episode]) => {
          const activeTorrent = activeTorrentsMap.get(episodeId.toLowerCase());
          
          return {
            episodeId,
            torrentHash: episodeId,
            progress: activeTorrent?.progress || {
              numPeers: 0,
              downloaded: 0,
              total: 0,
              progress: 0,
              downloadSpeed: 0,
              uploadSpeed: 0,
              remaining: '',
              isBuffering: false,
              ready: false,
              completed: false,
            },
            episodeInfo: {
              animeName: episode.animeName || '',
              animeImage: episode.animeImage || '',
              animeIdAnilist: episode.animeIdAnilist || 0,
              episodeImage: episode.episodeImage || '',
              episodeNumber: episode.episodeNumber || 0,
              episodeTorrentUrl: episode.episodeTorrentUrl || '',
              pubDate: episode.pubDate || '',
            },
            status: 'downloading' as const
          };
        });
      
      return { downloads: newDownloads };
    });
  }
}));

export default useDownloadsStore; 