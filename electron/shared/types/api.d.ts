import { IpcRendererEvent } from 'electron';

export interface TorrentProgress {
  numPeers: number;
  downloaded: number;
  total: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  remaining: string;
}

export interface TorrentServerDone {
  url: string;
  filePath: string;
}

export interface EventHandler<T = any> {
  subscribe: (callback: (event: IpcRendererEvent, data: T) => void) => void;
  unsubscribe: (callback: (event: IpcRendererEvent, data: T) => void) => void;
}

export interface TorrentApi {
  addTorrent: (torrentId: string) => void;
  torrent: {
    onProgress: EventHandler<TorrentProgress>;
    onDone: EventHandler<void>;
    onServerDone: EventHandler<TorrentServerDone>;
    onFile: EventHandler<any>;
    onError: EventHandler<{ error: string }>;
    onMkvProcess: EventHandler<{ filePath: string; status: string }>;
  };
}

export interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export interface SubtitleTrack {
  number: number;
  language: string;
  name: string;
  subtitles: Subtitle[];
}

export interface SubtitlesApi {
  extractSubtitles: (filePath: string) => Promise<{
    success: boolean;
    data?: SubtitleTrack[];
    error?: string;
  }>;
}
