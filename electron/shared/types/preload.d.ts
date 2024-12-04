import { ElectronAPI } from '@electron-toolkit/preload';
import { TorrentApi, SubtitlesApi } from './api';

export interface Api extends TorrentApi, SubtitlesApi {}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: Api;
  }
}
