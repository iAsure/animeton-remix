import { BrowserWindow, ipcMain, UtilityProcess, shell, app } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/event-channels.js';
import { setupTorrentHandlers } from '../services/torrent/handlers.js';
import { SubtitlesService } from '../services/subtitles/service.js';
import log from 'electron-log';
import path from 'path';
import os from 'os';
import { Worker as NodeWorker } from 'worker_threads';
import { ConfigService } from '../services/config/service.js';

export async function setupIpcHandlers(
  webTorrentProcess: UtilityProcess,
  subtitlesWorker: NodeWorker,
  mainWindow: BrowserWindow
) {
  // Initialize services
  const subtitlesService = new SubtitlesService(subtitlesWorker, mainWindow);
  const torrentHandlers = setupTorrentHandlers(
    webTorrentProcess,
    mainWindow,
    subtitlesService
  );

  const configService = new ConfigService(mainWindow);
  await configService.initialize();

  // Register torrent handler
  ipcMain.on(IPC_CHANNELS.TORRENT.ADD, (_, arg) => {
    log.debug('Torrent action received:', arg.action);
    webTorrentProcess.postMessage(arg);
  });

  // Handle WebTorrent process messages
  webTorrentProcess.on('message', async (message) => {
    const handler = torrentHandlers[message.type];
    if (handler) {
      await handler(message.data);
    } else {
      log.warn('Unknown torrent message type:', message.type);
    }
  });

  // Register subtitle extraction handler
  ipcMain.handle(IPC_CHANNELS.SUBTITLES.EXTRACT, async (_, filePath) => {
    return subtitlesService.processFile(filePath);
  });

  // Window control handlers
  ipcMain.handle(IPC_CHANNELS.WINDOW.IS_MAXIMIZED, () => {
    return mainWindow.isMaximized();
  });

  ipcMain.on(
    IPC_CHANNELS.WINDOW.CONTROL,
    (_, action: 'minimize' | 'maximize' | 'close') => {
      switch (action) {
        case 'minimize':
          mainWindow.minimize();
          break;
        case 'maximize':
          if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
            setTimeout(() => {
              if (mainWindow.isFullScreen()) mainWindow.maximize();
            }, 100);
          } else if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
          } else {
            mainWindow.maximize();
          }
          break;
        case 'close':
          mainWindow.close();
          break;
      }
    }
  );

  // Forward window state events to renderer
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send(IPC_CHANNELS.WINDOW.MAXIMIZE);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send(IPC_CHANNELS.WINDOW.UNMAXIMIZE);
  });

  mainWindow.on('resize', () => {
    mainWindow.webContents.send(IPC_CHANNELS.WINDOW.RESIZE);
  });

  ipcMain.on(IPC_CHANNELS.WINDOW.SET_FULLSCREEN, (_, shouldBeFullscreen) => {
    mainWindow.setFullScreen(shouldBeFullscreen);
  });

  // Listen for fullscreen changes
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send(IPC_CHANNELS.WINDOW.FULLSCREEN_CHANGE, true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send(IPC_CHANNELS.WINDOW.FULLSCREEN_CHANGE, false);
  });

  ipcMain.handle(IPC_CHANNELS.SHELL.OPEN_EXTERNAL, async (_, url: string) => {
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:', 'discord:'];

      if (!allowedProtocols.includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }

      await shell.openExternal(url);
      return true;
    } catch (error) {
      log.error('Failed to open external URL:', error);
      return false;
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.SHELL.OPEN_FILE_PATH,
    async (_, filePath: string) => {
      const PRESET_PATHS = {
        logs: () => path.join(app.getPath('userData'), 'logs'),
        downloads: () => path.join(process.env.TEMP || process.env.TMP || os.tmpdir(), 'webtorrent'),
        userData: () => app.getPath('userData'),
      } as const;

      type PresetPath = keyof typeof PRESET_PATHS;

      try {
        if (filePath in PRESET_PATHS) {
          const resolvedPath = PRESET_PATHS[filePath as PresetPath]();
          return await shell.openPath(resolvedPath);
        }

        return await shell.openPath(filePath);
      } catch (error) {
        log.error('Failed to open file path:', error);
        return `Failed to open path: ${error.message}`;
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.CONFIG.GET, async (_, key?: string) => {
    return await configService.get(key);
  });

  ipcMain.handle(
    IPC_CHANNELS.CONFIG.SET,
    async (_, key: string, value: any) => {
      await configService.set(key, value);
      mainWindow.webContents.send(IPC_CHANNELS.CONFIG.CHANGED, { key, value });
    }
  );

  ipcMain.handle(IPC_CHANNELS.CONFIG.UPDATE, async (_, config: any) => {
    await configService.update(config);
    mainWindow.webContents.send(IPC_CHANNELS.CONFIG.CHANGED, config);
  });

  mainWindow.on('closed', () => {
    configService.cleanup();
  });
}
