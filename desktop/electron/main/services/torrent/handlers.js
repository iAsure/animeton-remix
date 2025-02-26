import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';
import log from 'electron-log';
import { ipcMain } from 'electron';

export function setupTorrentHandlers(
  webTorrentProcess,
  mainWindow,
  subtitlesService
) {
  webTorrentProcess.setMaxListeners(100);
  
  ipcMain.handle(IPC_CHANNELS.TORRENT.ADD, async (_, payload) => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.ADD, 
      data: payload 
    });
    
    return new Promise((resolve, reject) => {
      const handleResponse = (message) => {
        const { type, data, error } = message;
        
        if (type === IPC_CHANNELS.TORRENT.SERVER_DONE) {
          clearTimeout(timeoutId);
          webTorrentProcess.off('message', handleResponse);
          resolve(data);
        } else if (type === IPC_CHANNELS.TORRENT.ERROR && error) {
          clearTimeout(timeoutId);
          webTorrentProcess.off('message', handleResponse);
          reject(new Error(error));
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
      
      // Add a timeout to ensure the listener is removed even if no response is received
      const timeoutId = setTimeout(() => {
        webTorrentProcess.off('message', handleResponse);
        reject(new Error('Timeout waiting for torrent server response'));
      }, 30000);
    });
  });

  ipcMain.handle(IPC_CHANNELS.TORRENT.GET_ACTIVE_TORRENTS, async () => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.GET_ACTIVE_TORRENTS 
    });
    
    return new Promise((resolve, reject) => {
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS) {
          clearTimeout(timeoutId);
          webTorrentProcess.off('message', handleResponse);
          resolve(message.data);
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
      
      const timeoutId = setTimeout(() => {
        webTorrentProcess.off('message', handleResponse);
        reject(new Error('Timeout waiting for active torrents'));
      }, 5000);
    });
  });

  ipcMain.handle(IPC_CHANNELS.TORRENT.PAUSE, async (_, payload) => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.PAUSE,
      data: { payload }
    });
    
    return new Promise((resolve, reject) => {
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.PAUSE) {
          clearTimeout(timeoutId);
          webTorrentProcess.off('message', handleResponse);
          resolve(message.data);
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
      
      const timeoutId = setTimeout(() => {
        webTorrentProcess.off('message', handleResponse);
        reject(new Error('Timeout waiting for pause response'));
      }, 5000);
    });
  });

  ipcMain.handle(IPC_CHANNELS.TORRENT.REMOVE, async (_, infoHash) => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.REMOVE,
      data: { infoHash }
    });
    
    return new Promise((resolve, reject) => {
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS) {
          clearTimeout(timeoutId);
          webTorrentProcess.off('message', handleResponse);
          resolve({ success: true });
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
      
      const timeoutId = setTimeout(() => {
        webTorrentProcess.off('message', handleResponse);
        resolve({ success: true });
      }, 5000);
    });
  });

  ipcMain.handle(IPC_CHANNELS.TORRENT.CHECK_SERVER, async () => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.CHECK_SERVER 
    });
    
    return new Promise((resolve, reject) => {
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.SERVER_STATUS) {
          clearTimeout(timeoutId);
          webTorrentProcess.off('message', handleResponse);
          resolve(message.data);
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
      
      const timeoutId = setTimeout(() => {
        webTorrentProcess.off('message', handleResponse);
        reject(new Error('Timeout checking server status'));
      }, 5000);
    });
  });

  ipcMain.handle(IPC_CHANNELS.TORRENT.SET_SPEED_LIMITS, async (_, limits) => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.SET_SPEED_LIMITS, 
      data: limits 
    });
    
    return new Promise((resolve, reject) => {
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.ERROR) {
          clearTimeout(timeoutId);
          webTorrentProcess.off('message', handleResponse);
          reject(new Error(message.data.error));
        } else {
          clearTimeout(timeoutId);
          webTorrentProcess.off('message', handleResponse);
          resolve();
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
      
      const timeoutId = setTimeout(() => {
        webTorrentProcess.off('message', handleResponse);
        resolve();
      }, 5000);
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
    [IPC_CHANNELS.TORRENT.ERROR]: (data) => {
      log.error('Torrent error received:', data);
      forwardToRenderer(IPC_CHANNELS.TORRENT.ERROR)(data);
    },
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
