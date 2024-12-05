const { contextBridge, ipcRenderer } = require('electron');

const createEventHandler = (channel) => ({
  subscribe: (callback) => ipcRenderer.on(channel, callback),
  unsubscribe: (callback) => ipcRenderer.removeListener(channel, callback),
});

(async () => {
  const { IPC_CHANNELS } = await import(
    '../shared/constants/event-channels.js'
  );

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
  };

  // Expose APIs to renderer process (window.api)
  contextBridge.exposeInMainWorld('api', api);
})().catch((err) => {
  console.error('Failed to initialize preload:', err);
});
