import { ElectronAPI } from '@electron-toolkit/preload';

interface Subtitle {
  start: number
  end: number
  text: string
}

interface SubtitleTrack {
  number: number
  language: string
  name: string
  subtitles: Subtitle[]
}

interface Api {
  addTorrent: (torrentId: string) => void;
  onTorrentProgress: (
    callback: (event: Electron.IpcRendererEvent, data: any) => void
  ) => void;
  onTorrentDone: (callback: (event: Electron.IpcRendererEvent) => void) => void;
  onTorrentServerDone: (
    callback: (event: Electron.IpcRendererEvent, data: any) => void
  ) => void;
  onTorrentFile: (
    callback: (event: Electron.IpcRendererEvent, data: any) => void
  ) => void;
  onTorrentError: (
    callback: (event: Electron.IpcRendererEvent, data: any) => void
  ) => void;
  removeTorrentProgress: (
    callback: (event: Electron.IpcRendererEvent, data: any) => void
  ) => void;
  removeTorrentDone: (
    callback: (event: Electron.IpcRendererEvent) => void
  ) => void;
  removeTorrentServerDone: (
    callback: (event: Electron.IpcRendererEvent, data: any) => void
  ) => void;
  removeTorrentFile: (
    callback: (event: Electron.IpcRendererEvent, data: any) => void
  ) => void;
  removeTorrentError: (
    callback: (event: Electron.IpcRendererEvent, data: any) => void
  ) => void;
  extractSubtitles: (filePath: string) => Promise<{
    success: boolean;
    data?: SubtitleTrack[];
    error?: string;
  }>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: Api;
  }
}
