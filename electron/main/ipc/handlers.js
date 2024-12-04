import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/event-channels.js';
import { setupTorrentHandlers } from '../services/torrent/handlers.js';
import { setupSubtitlesHandlers } from '../services/subtitles/handlers.js';
import log from 'electron-log';

export function setupIpcHandlers(webTorrentProcess, subtitlesWorker, mainWindow) {
  // Setup service handlers
  const torrentHandlers = setupTorrentHandlers(webTorrentProcess, mainWindow);
  const subtitlesHandlers = setupSubtitlesHandlers(subtitlesWorker, mainWindow);

  // Register IPC handlers
  ipcMain.on(IPC_CHANNELS.TORRENT.ADD, (_, arg) => {
    log.debug('Torrent action received:', arg.action);
    webTorrentProcess.postMessage(arg);
  });

  // Setup message handlers for WebTorrent process
  webTorrentProcess.on('message', (message) => {
    const handler = torrentHandlers[message.type];
    if (handler) {
      handler(message.data);
    } else {
      log.warn('Unknown torrent message type:', message.type);
    }
  });

  // Setup subtitles extraction handler
  ipcMain.handle(IPC_CHANNELS.SUBTITLES.EXTRACT, (_, filePath) => {
    return subtitlesHandlers.extractSubtitles(filePath);
  });
}