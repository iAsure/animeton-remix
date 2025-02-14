import { IpcRendererEvent } from 'electron';

export interface TorrentProgress {
  numPeers: number;
  downloaded: number;
  total: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  remaining: string;
  isBuffering: boolean;
  ready: boolean;
  isPaused: boolean;
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
  add: (payload: { torrentUrl: string; torrentHash: string }) => Promise<void>;
  checkServer: () => Promise<{ active: boolean; port?: number }>;
  getActiveTorrents: () => Promise<ActiveTorrent[]>;
  pause: (payload: {
    infoHash: string;
    torrentUrl: string;
  }) => Promise<{ success: boolean; isPaused: boolean }>;
  remove: (infoHash: string) => Promise<{ success: boolean }>;
  onProgress: EventHandler<TorrentProgress>;
  onDone: EventHandler<void>;
  onServerDone: EventHandler<TorrentServerDone>;
  onFile: EventHandler<any>;
  onError: EventHandler<{ error: string }>;
  onMkvProcess: EventHandler<TorrentMkvProcess>;
  onDownloadRanges: EventHandler<TorrentRangeData>;
  onServerStatus: EventHandler<{ active: boolean; port?: number }>;
  onWarning: EventHandler<{ warning: string }>;
  onActiveTorrents: EventHandler<ActiveTorrent[]>;
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
  quitApp: () => void;
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
  quitAndInstall: () => void;
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
  episodeFileName: string;
  pubDate: string;
  progressData: WatchProgress;
}

export interface WatchHistory {
  lastUpdated: number;
  episodes: {
    [id: string]: EpisodeHistory;
  };
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

export interface ActivationResult {
  success: boolean;
  message?: string;
  key?: string;
  discordId?: string;
  createdAt?: string;
  activatedAt?: string;
}

export interface ActivationStatus {
  isValid: boolean;
}

export interface ActivationError {
  error: string;
}

export interface ActivationApi {
  validateKey: (key: string) => Promise<boolean>;
  activateKey: (key: string) => Promise<ActivationResult>;
  onSuccess: EventHandler<void>;
  onError: EventHandler<ActivationError>;
  onStatusChanged: EventHandler<ActivationStatus>;
}

export interface NotificationApi {
  show: (options: {
    title: string;
    body: string;
    type?: 'success' | 'error' | 'warning' | 'info';
  }) => void;
}

export interface LogApi {
  getContent: () => Promise<string>;
}

export interface NavigationApi {
  onNavigate: EventHandler<{ path: string }>;
}

export interface Api {
  torrent: TorrentApi;
  subtitles: SubtitlesApi;
  shell: ShellApi;
  config: ConfigApi;
  updater: UpdaterApi;
  discord: DiscordApi;
  chapters: ChaptersApi;
  history: HistoryApi;
  activation: ActivationApi;
  notification: NotificationApi;
  log: LogApi;
  navigation: NavigationApi;
}
