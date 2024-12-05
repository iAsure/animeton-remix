import { ElectronAPI } from '@electron-toolkit/preload';
import type { Api } from './api';

declare global {
  // This merges with the existing Window interface
  interface Window {
    electron: ElectronAPI;
    api: Api;
  }
}

// Need to export something to make it a module
export {}; 