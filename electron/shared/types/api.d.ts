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
  onProgress: EventHandler<TorrentProgress>;
  onDone: EventHandler<void>;
  onServerDone: EventHandler<TorrentServerDone>;
  onFile: EventHandler<any>;
  onError: EventHandler<{ error: string }>;
  onMkvProcess: EventHandler<TorrentMkvProcess>;
  onDownloadRanges: EventHandler<TorrentRangeData>;
  onServerStatus: EventHandler<{ active: boolean; port?: number }>;
  onWarning: EventHandler<{ warning: string }>;
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

export interface DiscordActivity {
  timestamps?: { start: number };
  details?: string;
  state?: string;
  assets?: {
    small_image?: string;
    small_text?: string;
    large_image?: string;
    large_text?: string;
  };
  buttons?: Array<{
    label: string;
    url: string;
  }>;
}

export interface DiscordApi {
  setActivity: (activity: { activity: DiscordActivity }) => void;
  setShowStatus: (show: boolean) => void;
  onW2GLink: EventHandler<string>;
}

export interface Chapter {
  start: number;
  end: number;
  text: string;
  language: string;
}

export interface ChaptersResult {
  success: boolean;
  data?: Chapter[];
  error?: string;
}

export interface MkvMetadata {
  subtitles: SubtitleTrack[];
  chapters: Chapter[];
}

export interface ChaptersApi {
  onExtracted: EventHandler<ChaptersResult>;
}

export interface WatchProgress {
  timeStamp: number;
  duration: number;
  progress: number;
  completed: boolean;
  lastWatched: number;
}

export interface EpisodeHistory {
  animeName: string;
  animeImage: string;
  animeIdAnilist: number;
  episodeImage: string;
  episodeNumber: number;
  episodeTorrentUrl: string;
  pubDate: string;
  progressData: WatchProgress;
}

export interface WatchHistory {
  lastUpdated: number;
  episodes: {
    [id: string]: EpisodeHistory;
  }
}

export interface HistoryApi {
  getProgress: (episodeId: string) => Promise<EpisodeHistory | undefined>;
  updateProgress: (
    episodeId: string, 
    progress: number, 
    duration: number,
    episodeInfo: Omit<EpisodeHistory, 'progressData'>
  ) => Promise<void>;
  getAll: () => Promise<WatchHistory>;
  clear: () => Promise<void>;
  onChanged: EventHandler<WatchHistory>;
  onEpisodeUpdated: EventHandler<{
    episodeId: string;
    episode: EpisodeHistory;
  }>;
}

export interface Api {
  addTorrent: (torrentUrl: string, torrentHash: string) => void;
  checkTorrentServer: () => void;
  torrent: TorrentApi;
  subtitles: SubtitlesApi;
  shell: ShellApi;
  config: ConfigApi;
  updater: UpdaterApi;
  discord: DiscordApi;
  chapters: ChaptersApi;
  history: HistoryApi;
}
