const { contextBridge, ipcRenderer } = require('electron');

// Helper for event management
const createEventHandler = (channel) => ({
  subscribe: (callback) => ipcRenderer.on(channel, callback),
  unsubscribe: (callback) => ipcRenderer.removeListener(channel, callback)
});

// Dynamic import of event channels
(async () => {
  const { IPC_CHANNELS } = await import('../shared/constants/event-channels.js');

  // Define APIs
  const torrentApi = {
    addTorrent: (torrentId) => {
      ipcRenderer.send(IPC_CHANNELS.TORRENT.ADD, { 
        action: 'add-torrent', 
        torrentId 
      });
    },

    torrent: {
      onProgress: createEventHandler(IPC_CHANNELS.TORRENT.PROGRESS),
      onDone: createEventHandler(IPC_CHANNELS.TORRENT.DONE),
      onServerDone: createEventHandler(IPC_CHANNELS.TORRENT.SERVER_DONE),
      onFile: createEventHandler(IPC_CHANNELS.TORRENT.FILE),
      onError: createEventHandler(IPC_CHANNELS.TORRENT.ERROR),
      onMkvProcess: createEventHandler(IPC_CHANNELS.TORRENT.MKV_PROCESS)
    }
  };

  const subtitlesApi = {
    extractSubtitles: (filePath) => 
      ipcRenderer.invoke(IPC_CHANNELS.SUBTITLES.EXTRACT, filePath)
  };

  // Expose APIs to renderer process
  contextBridge.exposeInMainWorld('api', {
    ...torrentApi,
    ...subtitlesApi
  });
})().catch(err => {
  console.error('Failed to initialize preload:', err);
});