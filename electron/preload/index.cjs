const { contextBridge, ipcRenderer } = require('electron');

const createEventHandler = (channel) => ({
  subscribe: (callback) => ipcRenderer.on(channel, callback),
  unsubscribe: (callback) => ipcRenderer.removeListener(channel, callback),
});

(async () => {
  const { IPC_CHANNELS } = await import(
    '../shared/constants/event-channels.js'
  );

  const electron = {
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
        action: 'add-torrent',
        torrentId,
      });
    },

    torrent: {
      onProgress: createEventHandler(IPC_CHANNELS.TORRENT.PROGRESS),
      onDone: createEventHandler(IPC_CHANNELS.TORRENT.DONE),
      onServerDone: createEventHandler(IPC_CHANNELS.TORRENT.SERVER_DONE),
      onFile: createEventHandler(IPC_CHANNELS.TORRENT.FILE),
      onError: createEventHandler(IPC_CHANNELS.TORRENT.ERROR),
      onMkvProcess: createEventHandler(IPC_CHANNELS.TORRENT.MKV_PROCESS),
    },

    subtitles: {
      extractSubtitles: (filePath) =>
        ipcRenderer.invoke(IPC_CHANNELS.SUBTITLES.EXTRACT, filePath),
      onExtracted: createEventHandler(IPC_CHANNELS.SUBTITLES.EXTRACTED),
      onError: createEventHandler(IPC_CHANNELS.SUBTITLES.ERROR),
    },

    shell: {
      openExternal: (url) => ipcRenderer.invoke(IPC_CHANNELS.SHELL.OPEN_EXTERNAL, url),
    },

    config: {
      get: (key) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG.GET, key),
      set: (key, value) => 
        ipcRenderer.invoke(IPC_CHANNELS.CONFIG.SET, key, value),
      update: (config) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG.UPDATE, config),
      onChange: createEventHandler(IPC_CHANNELS.CONFIG.CHANGED),
    },
  };

  contextBridge.exposeInMainWorld('electron', electron);
  contextBridge.exposeInMainWorld('api', api);
})().catch((err) => {
  console.error('Failed to initialize preload:', err);
});
