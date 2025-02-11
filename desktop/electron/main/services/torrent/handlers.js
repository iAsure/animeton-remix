import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';
import log from 'electron-log';
import { ipcMain } from 'electron';

export function setupTorrentHandlers(
  webTorrentProcess,
  mainWindow,
  subtitlesService
) {
  ipcMain.handle(IPC_CHANNELS.TORRENT.GET_ACTIVE_TORRENTS, async () => {
    return new Promise((resolve) => {
      webTorrentProcess.postMessage({ type: IPC_CHANNELS.TORRENT.GET_ACTIVE_TORRENTS });
      
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS) {
          webTorrentProcess.off('message', handleResponse);
          resolve(message.data);
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
    });
  });

  return {
    [IPC_CHANNELS.TORRENT.PROGRESS]: (data) => {
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.PROGRESS, data);
    },

    [IPC_CHANNELS.TORRENT.DOWNLOAD_RANGES]: (data) => {
      if (!data.ranges) return;
      
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.DOWNLOAD_RANGES, data);
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

    [IPC_CHANNELS.TORRENT.SERVER_STATUS]: (data) => {
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.SERVER_STATUS, data);
    },

    // [IPC_CHANNELS.TORRENT.WARNING]: (data) => {
    //   mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.WARNING, data);
    // },

    [IPC_CHANNELS.TORRENT.MKV_PROCESS]: async (data) => {
      log.info('Processing MKV file:', data.filePath);
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.MKV_PROCESS, data);

      // Process subtitles if available
      if (subtitlesService) {
        await subtitlesService.processFile(data.filePath);
      }
    },

    [IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS]: (data) => {
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS, data);
    },
  };
}
