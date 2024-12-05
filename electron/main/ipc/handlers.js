import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/event-channels.js';
import { setupTorrentHandlers } from '../services/torrent/handlers.js';
import { SubtitlesService } from '../services/subtitles/service.js';
import log from 'electron-log';

export function setupIpcHandlers(webTorrentProcess, subtitlesWorker, mainWindow) {
  // Initialize services
  const subtitlesService = new SubtitlesService(subtitlesWorker, mainWindow);
  const torrentHandlers = setupTorrentHandlers(webTorrentProcess, mainWindow, subtitlesService);

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
}