import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';
import log from 'electron-log';
import { ipcMain } from 'electron';

export function setupTorrentHandlers(
  webTorrentProcess,
  mainWindow,
  subtitlesService
) {
  webTorrentProcess.setMaxListeners(100);
  
  webTorrentProcess.on('error', (error) => {
    log.error('WebTorrent process error:', error);
    if (mainWindow?.webContents) {
      mainWindow.webContents.send(IPC_CHANNELS.TORRENT.ERROR, {
        error: error.message || 'Error en el proceso de WebTorrent'
      });
    }
  });
  
  webTorrentProcess.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection in WebTorrent process:', reason);
    if (mainWindow?.webContents) {
      mainWindow.webContents.send(IPC_CHANNELS.TORRENT.ERROR, {
        error: reason?.message || 'Error no controlado en el proceso de WebTorrent'
      });
    }
  });
  
  webTorrentProcess.on('uncaughtException', (error) => {
    log.error('Uncaught Exception in WebTorrent process:', error);
    if (mainWindow?.webContents) {
      mainWindow.webContents.send(IPC_CHANNELS.TORRENT.ERROR, {
        error: error.message || 'Excepción no controlada en el proceso de WebTorrent'
      });
    }
  });
  
  ipcMain.handle(IPC_CHANNELS.TORRENT.ADD, async (_, payload) => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.ADD, 
      data: payload 
    });
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        webTorrentProcess.off('message', handleResponse);
        reject(new Error('Timeout al esperar respuesta del servidor torrent'));
      }, 60000);
      
      const handleResponse = (message) => {
        const { type, data } = message;
        
        if (type === IPC_CHANNELS.TORRENT.SERVER_DONE) {
          clearTimeout(timeout);
          webTorrentProcess.off('message', handleResponse);
          resolve(data);
        } else if (type === IPC_CHANNELS.TORRENT.ERROR) {
          clearTimeout(timeout);
          webTorrentProcess.off('message', handleResponse);
          log.error('Torrent error in ADD handler:', data);
          reject(new Error(data.error || 'Error desconocido'));
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
    });
  });

  ipcMain.handle(IPC_CHANNELS.TORRENT.GET_ACTIVE_TORRENTS, async () => {
    webTorrentProcess.postMessage({ 
      type: IPC_CHANNELS.TORRENT.GET_ACTIVE_TORRENTS 
    });
    
    return new Promise((resolve, reject) => {
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
    
    return new Promise((resolve, reject) => {
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
    
    return new Promise((resolve, reject) => {
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
    
    return new Promise((resolve, reject) => {
      const handleResponse = (message) => {
        if (message.type === IPC_CHANNELS.TORRENT.SERVER_STATUS) {
          webTorrentProcess.off('message', handleResponse);
          resolve(message.data);
        }
      };
      
      webTorrentProcess.on('message', handleResponse);
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
          webTorrentProcess.off('message', handleResponse);
          reject(new Error(message.data.error));
        } else {
          webTorrentProcess.off('message', handleResponse);
          resolve();
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
        try {
          await subtitlesService.processFile(data.filePath);
        } catch (error) {
          log.error('Error processing subtitles:', error);
          mainWindow?.webContents.send(IPC_CHANNELS.TORRENT.ERROR, {
            error: `Error procesando subtítulos: ${error.message}`
          });
        }
      }
    }
  };

  return torrentHandlers;
}
