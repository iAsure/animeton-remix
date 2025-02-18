import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';
import log from 'electron-log';
import { ipcMain } from 'electron';

export function setupTorrentHandlers(
  webTorrentProcess,
  mainWindow,
  subtitlesService
) {
  ipcMain.handle(IPC_CHANNELS.TORRENT.ADD, async (_, payload) => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.ADD, 
      data: payload 
    });
    
    return new Promise((resolve, reject) => {
      const handleResponse = (message) => {
        const { type, data, error } = message;
        
        if (type === IPC_CHANNELS.TORRENT.SERVER_DONE) {
          webTorrentProcess.off('message', handleResponse);
          resolve(data);
        } else if (type === IPC_CHANNELS.TORRENT.ERROR && error) {
          webTorrentProcess.off('message', handleResponse);
          reject(new Error(error));
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
    });
  });

  ipcMain.handle(IPC_CHANNELS.TORRENT.GET_ACTIVE_TORRENTS, async () => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.GET_ACTIVE_TORRENTS 
    });
    
    return new Promise((resolve) => {
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS) {
          webTorrentProcess.off('message', handleResponse);
          resolve(message.data);
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
    });
  });

  ipcMain.handle(IPC_CHANNELS.TORRENT.PAUSE, async (_, payload) => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.PAUSE,
      data: { payload }
    });
    
    return new Promise((resolve) => {
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.PAUSE) {
          webTorrentProcess.off('message', handleResponse);
          resolve(message.data);
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
    });
  });

  ipcMain.handle(IPC_CHANNELS.TORRENT.REMOVE, async (_, infoHash) => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.REMOVE,
      data: { infoHash }
    });
    
    return new Promise((resolve) => {
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS) {
          webTorrentProcess.off('message', handleResponse);
          resolve({ success: true });
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
    });
  });

  ipcMain.handle(IPC_CHANNELS.TORRENT.CHECK_SERVER, async () => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.CHECK_SERVER 
    });
    
    return new Promise((resolve) => {
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.SERVER_STATUS) {
          webTorrentProcess.off('message', handleResponse);
          resolve(message.data);
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
    });
  });

  const forwardToRenderer = (type) => (data) => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send(type, data);
    }
  };

  const torrentHandlers = {
    [IPC_CHANNELS.TORRENT.PROGRESS]: forwardToRenderer(IPC_CHANNELS.TORRENT.PROGRESS),
    [IPC_CHANNELS.TORRENT.DOWNLOAD_RANGES]: forwardToRenderer(IPC_CHANNELS.TORRENT.DOWNLOAD_RANGES),
    [IPC_CHANNELS.TORRENT.DONE]: forwardToRenderer(IPC_CHANNELS.TORRENT.DONE),
    [IPC_CHANNELS.TORRENT.ERROR]: forwardToRenderer(IPC_CHANNELS.TORRENT.ERROR),
    [IPC_CHANNELS.TORRENT.SERVER_STATUS]: forwardToRenderer(IPC_CHANNELS.TORRENT.SERVER_STATUS),
    [IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS]: forwardToRenderer(IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS),
    [IPC_CHANNELS.TORRENT.SERVER_DONE]: forwardToRenderer(IPC_CHANNELS.TORRENT.SERVER_DONE),
    [IPC_CHANNELS.TORRENT.PAUSE]: forwardToRenderer(IPC_CHANNELS.TORRENT.PAUSE),
    [IPC_CHANNELS.TORRENT.MKV_PROCESS]: async (data) => {
      mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.MKV_PROCESS, data);
      if (subtitlesService && data.status === 'ready_for_subtitles') {
        await subtitlesService.processFile(data.filePath);
      }
    }
  };

  return torrentHandlers;
}
