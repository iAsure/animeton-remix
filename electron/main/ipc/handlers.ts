import { BrowserWindow, ipcMain, UtilityProcess, shell } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/event-channels.js';
import { setupTorrentHandlers } from '../services/torrent/handlers.js';
import { SubtitlesService } from '../services/subtitles/service.js';
import log from 'electron-log';
import { Worker as NodeWorker } from 'worker_threads';

export function setupIpcHandlers(
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

  ipcMain.on(IPC_CHANNELS.WINDOW.CONTROL, (_, action: 'minimize' | 'maximize' | 'close') => {
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
  });

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
}
