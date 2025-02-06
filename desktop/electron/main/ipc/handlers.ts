import { BrowserWindow, ipcMain, UtilityProcess, shell, app, Notification } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/event-channels.js';
import { setupTorrentHandlers } from '../services/torrent/handlers.js';
import { SubtitlesService } from '../services/subtitles/service.js';
import log from 'electron-log';
import path from 'path';
import os from 'os';
import { Worker as NodeWorker } from 'worker_threads';
import { ConfigService } from '../services/config/service.js';
import { HistoryService } from '../services/history/service.js';
import { validateActivationKey, closeActivationWindow, activateKey } from '../core/activation-window.js';
import { setupWindow } from '../core/window.js';
import { AppConfig } from 'electron/shared/types/config.js';
import fs from 'fs/promises';
import { init as initUpdater } from '../core/updater.js';

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

  const historyService = new HistoryService(mainWindow);
  await historyService.initialize();

  // Register torrent handler
  ipcMain.on(IPC_CHANNELS.TORRENT.ADD, (_, arg) => {
    log.debug('Torrent action received:', arg);
    const { action, torrentUrl, torrentHash } = arg;
    const message = {
      action,
      torrentUrl,
      torrentHash,
    };
    
    webTorrentProcess.postMessage(message);
  });

  // Handle WebTorrent process messages
  webTorrentProcess.on('message', async (message) => {
    const handler = torrentHandlers[message.type];
    if (handler) {
      await handler(message.data);
    } else {
      log.warn('Unknown torrent message type:', message);
    }
  });

  // Register subtitle extraction handler
  ipcMain.handle(IPC_CHANNELS.SUBTITLES.EXTRACT, async (_, filePath) => {
    log.info('Main process: Received extract request for:', { filePath });
    
    if (!filePath) {
      const error = new Error('No file path provided');
      log.error(error);
      throw error;
    }

    try {
      const result = await subtitlesService.processFile(filePath);
      return result;
    } catch (error) {
      log.error('Main process: Extraction failed:', error);
      mainWindow.webContents.send(IPC_CHANNELS.SUBTITLES.ERROR, {
        error: error.message || 'Unknown error during subtitle extraction'
      });
      throw error;
    }
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

  ipcMain.handle(IPC_CHANNELS.SHELL.TOGGLE_DEV_TOOLS, async () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  ipcMain.handle(IPC_CHANNELS.SHELL.IS_DEV_TOOLS_OPENED, () => {
    return mainWindow.webContents.isDevToolsOpened();
  });

  ipcMain.handle(IPC_CHANNELS.SHELL.QUIT_APP, () => {
    app.quit();
  });

  // History handlers
  
  ipcMain.handle(IPC_CHANNELS.HISTORY.GET_PROGRESS, async (_, episodeId) => {
    return await historyService.getEpisodeProgress(episodeId);
  });

  ipcMain.handle(
    IPC_CHANNELS.HISTORY.UPDATE_PROGRESS,
    async (_, episodeId, progress, duration, episodeInfo) => {
      await historyService.updateEpisodeProgress(
        episodeId, 
        progress, 
        duration,
        episodeInfo
      );
    }
  );

  ipcMain.handle(IPC_CHANNELS.HISTORY.GET_ALL, async () => {
    return await historyService.getAllHistory();
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY.CLEAR, async () => {
    await historyService.clearHistory();
  });

  mainWindow.on('closed', () => {
    configService.cleanup();
    historyService.cleanup();
  });

  ipcMain.handle(IPC_CHANNELS.ACTIVATION.VALIDATE, async (_, key) => {
    return await validateActivationKey(key);
  });

  ipcMain.handle(IPC_CHANNELS.ACTIVATION.ACTIVATE, async (event, key) => {
    try {
      const activationResult = await activateKey(key);
      
      if (activationResult.success) {
        const configService = new ConfigService(BrowserWindow.fromWebContents(event.sender));
        await configService.initialize();
        await configService.update({
          user: {
            activationKey: activationResult.key,
            discordId: activationResult.discordId,
            createdAt: activationResult.createdAt,
            activatedAt: activationResult.activatedAt
          }
        })

        app.relaunch();
        app.exit();
        
        return activationResult;
      } else {
        event.sender.send(IPC_CHANNELS.ACTIVATION.ERROR, { 
          error: activationResult.message || 'Error al activar la clave' 
        });
        return activationResult;
      }
    } catch (error) {
      log.error('Activation error:', error);
      event.sender.send(IPC_CHANNELS.ACTIVATION.ERROR, { 
        error: 'Error al activar la clave' 
      });
      return { success: false, message: error.message };
    }
  });

  const notifyActivationStatus = async () => {
    try {
      const config = await configService.get<AppConfig>();
      const isValid = await validateActivationKey(config?.user?.activationKey);
      mainWindow.webContents.send(IPC_CHANNELS.ACTIVATION.STATUS_CHANGED, { isValid });
    } catch (error) {
      log.error('Error checking activation status:', error);
    }
  };

  ipcMain.on(IPC_CHANNELS.CONFIG.CHANGED, notifyActivationStatus);

  ipcMain.handle('show-notification', async (_, options) => {
    log.info('Showing notification:', options);
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: path.join(process.env.VITE_PUBLIC ?? '', 'icon.png'),
      silent: false
    });

    notification.show();
  });

  ipcMain.handle(IPC_CHANNELS.LOG.GET_CONTENT, async () => {
    try {
      const logFilePath = log.transports.file.getFile().path;
      const logContent = await fs.readFile(logFilePath, 'utf-8');
      return logContent;
    } catch (error) {
      log.error('Failed to read log file:', error);
      throw error;
    }
  });

  initUpdater(mainWindow);
}
