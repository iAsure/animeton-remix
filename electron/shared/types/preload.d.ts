import type { Api } from './api';

// Custom electron API interface
interface IpcApi {
  send: (channel: string, data?: any) => void;
  invoke: (channel: string, data?: any) => Promise<any>;
  on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
  once: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
  removeListener: (channel: string, callback: Function) => void;
}

interface EnviromentApi {
  POSTHOG_API_KEY: string;
}

interface CustomElectronAPI {
  ipc: IpcApi;
  env: EnviromentApi;
}

declare global {
  interface Window {
    electron: CustomElectronAPI;
    api: Api;
  }
}

export {}; 