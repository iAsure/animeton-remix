const { contextBridge, ipcRenderer } = require('electron');

ipcRenderer.setMaxListeners(0);

const createEventHandler = (channel) => ({
  subscribe: (callback) => ipcRenderer.on(channel, callback),
  unsubscribe: (callback) => ipcRenderer.removeListener(channel, callback),
});

(async () => {
  const { IPC_CHANNELS } = await import(
    '../shared/constants/event-channels.js'
  );

  const electron = {
    env: {
      POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    },
    ipc: {
      send: (channel, data) => ipcRenderer.send(channel, data),
      invoke: (channel, data) => ipcRenderer.invoke(channel, data),
      on: (channel, callback) => ipcRenderer.on(channel, callback),
      once: (channel, callback) => ipcRenderer.once(channel, callback),
      removeListener: (channel, callback) => 
        ipcRenderer.removeListener(channel, callback),
    }
  };

  const api = {
    addTorrent: (torrentId) => {
      ipcRenderer.send(IPC_CHANNELS.TORRENT.ADD, {
        action: torrentId === 'destroy' ? 'destroy' : 'add-torrent',
        torrentId,
      });
    },
    
    checkTorrentServer: () => {
      ipcRenderer.send(IPC_CHANNELS.TORRENT.ADD, {
        action: 'check-server'
      });
    },

    torrent: {
      onProgress: createEventHandler(IPC_CHANNELS.TORRENT.PROGRESS),
      onDone: createEventHandler(IPC_CHANNELS.TORRENT.DONE),
      onServerDone: createEventHandler(IPC_CHANNELS.TORRENT.SERVER_DONE),
      onFile: createEventHandler(IPC_CHANNELS.TORRENT.FILE),
      onError: createEventHandler(IPC_CHANNELS.TORRENT.ERROR),
      onMkvProcess: createEventHandler(IPC_CHANNELS.TORRENT.MKV_PROCESS),
      onDownloadRanges: createEventHandler(IPC_CHANNELS.TORRENT.DOWNLOAD_RANGES),
      onServerStatus: createEventHandler(IPC_CHANNELS.TORRENT.SERVER_STATUS),
      onWarning: createEventHandler(IPC_CHANNELS.TORRENT.WARNING),
    },

    subtitles: {
      extractSubtitles: (filePath) => {
        console.log('Preload: Calling extractSubtitles with:', filePath);
        return ipcRenderer.invoke(IPC_CHANNELS.SUBTITLES.EXTRACT, filePath)
          .catch(error => {
            console.error('Preload: Extract subtitles failed:', error);
            throw error;
          });
      },
      onExtracted: createEventHandler(IPC_CHANNELS.SUBTITLES.EXTRACTED),
      onError: createEventHandler(IPC_CHANNELS.SUBTITLES.ERROR),
    },

    chapters: {
      onExtracted: createEventHandler(IPC_CHANNELS.CHAPTERS.EXTRACTED),
    },

    shell: {
      openExternal: (url) => ipcRenderer.invoke(IPC_CHANNELS.SHELL.OPEN_EXTERNAL, url),
      openPath: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.SHELL.OPEN_FILE_PATH, filePath),
      toggleDevTools: () => ipcRenderer.invoke(IPC_CHANNELS.SHELL.TOGGLE_DEV_TOOLS),
      isDevToolsOpened: () => ipcRenderer.invoke(IPC_CHANNELS.SHELL.IS_DEV_TOOLS_OPENED),
    },

    config: {
      get: (key) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG.GET, key),
      set: (key, value) => 
        ipcRenderer.invoke(IPC_CHANNELS.CONFIG.SET, key, value),
      update: (config) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG.UPDATE, config),
      onChange: createEventHandler(IPC_CHANNELS.CONFIG.CHANGED),
    },

    updater: {
      onError: createEventHandler(IPC_CHANNELS.UPDATER.ERROR),
      onChecking: createEventHandler(IPC_CHANNELS.UPDATER.CHECKING_FOR_UPDATE),
      onAvailable: createEventHandler(IPC_CHANNELS.UPDATER.AVAILABLE),
      onNotAvailable: createEventHandler(IPC_CHANNELS.UPDATER.NOT_AVAILABLE),
      onDownloaded: createEventHandler(IPC_CHANNELS.UPDATER.DOWNLOADED),
    },

    discord: {
      setActivity: (activity) => {
        ipcRenderer.send('discord', activity);
      },
      setShowStatus: (show) => {
        ipcRenderer.send('show-discord-status', show);
      },
      onW2GLink: createEventHandler('w2glink'),
    },
  };

  contextBridge.exposeInMainWorld('electron', electron);
  contextBridge.exposeInMainWorld('api', api);
})().catch((err) => {
  console.error('Failed to initialize preload:', err);
});
