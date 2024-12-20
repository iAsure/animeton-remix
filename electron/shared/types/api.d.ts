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

export interface TorrentFileProgress {
  startPiece: number;
  endPiece: number;
  numPieces: number;
  numPiecesPresent: number;
}

export interface TorrentRangeData {
  ranges: { start: number; end: number }[];
  downloaded: number;
  total: number;
  progress: number;
  fileProgress: TorrentFileProgress;
}

export interface TorrentApi {
  addTorrent: (torrentId: string) => void;
  onProgress: EventHandler<TorrentProgress>;
  onDone: EventHandler<void>;
  onServerDone: EventHandler<TorrentServerDone>;
  onFile: EventHandler<any>;
  onError: EventHandler<{ error: string }>;
  onMkvProcess: EventHandler<TorrentMkvProcess>;
  onDownloadRanges: EventHandler<TorrentRangeData>;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface SubtitleTrack {
  track: {
    number: number;
    language: string;
    type: string;
    name: string;
    header: string;
  };
  cues: SubtitleCue[];
}

export interface SubtitleResult {
  success: boolean;
  data?: SubtitleTrack[];
  error?: string;
}

export interface SubtitlesApi {
  extractSubtitles: (filePath: string) => Promise<SubtitleResult>;
  onExtracted: EventHandler<SubtitleResult>;
  onError: EventHandler<{ error: string }>;
}

export interface ShellApi {
  openExternal: (url: string) => Promise<boolean>;
  openPath: (path: string) => Promise<boolean>;
  toggleDevTools: () => Promise<void>;
  isDevToolsOpened: () => Promise<boolean>;
}

export interface ConfigApi {
  get: (key?: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  update: (config: any) => Promise<void>;
  onChange: EventHandler<any>;
}

export interface UpdaterApi {
  onError: EventHandler<{ error: string }>;
  onChecking: EventHandler<void>;
  onAvailable: EventHandler<void>;
  onNotAvailable: EventHandler<void>;
  onDownloaded: EventHandler<any>;
}

export interface Api {
  addTorrent: (torrentId: string) => void;
  torrent: TorrentApi;
  subtitles: SubtitlesApi;
  shell: ShellApi;
  config: ConfigApi;
  updater: UpdaterApi;
}
