import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';
import log from 'electron-log';

export function setupTorrentHandlers(webTorrentProcess, mainWindow) {
  const handlers = {
    [IPC_CHANNELS.TORRENT.PROGRESS]: (data) => {
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.PROGRESS, data);
    },

    [IPC_CHANNELS.TORRENT.DONE]: () => {
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.DONE);
    },

    [IPC_CHANNELS.TORRENT.SERVER_DONE]: (data) => {
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.SERVER_DONE, data);
    },

    [IPC_CHANNELS.TORRENT.ERROR]: (error) => {
      log.error('Torrent error:', error);
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.ERROR, error);
    },

    [IPC_CHANNELS.TORRENT.MKV_PROCESS]: (data) => {
      log.info('Processing MKV file:', data.filePath);
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.MKV_PROCESS, data);
    }
  };

  return handlers;
}