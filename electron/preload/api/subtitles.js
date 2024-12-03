const { contextBridge, ipcRenderer } = require('electron');

// Custom APIs for renderer
const api = {
  extractSubtitles: (filePath) => ipcRenderer.invoke('extract-subtitles', filePath),
};

contextBridge.exposeInMainWorld('api', api);
