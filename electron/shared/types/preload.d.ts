import { ElectronAPI } from '@electron-toolkit/preload';
import { Api } from './api.d.ts';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: Api;
  }
}
