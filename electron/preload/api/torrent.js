const { contextBridge, ipcRenderer } = require('electron');

// Custom APIs for renderer
const api = {
  // Torrents
  addTorrent: (torrentId) => {
    ipcRenderer.send('webtorrent-action', { action: 'add-torrent', torrentId });
  },
  onTorrentProgress: (callback) => ipcRenderer.on('torrent-progress', callback),
  onTorrentDone: (callback) => ipcRenderer.on('torrent-done', callback),
  onTorrentServerDone: (callback) =>
    ipcRenderer.on('torrent-server-done', callback),
  onTorrentFile: (callback) => ipcRenderer.on('torrent-file', callback),
  onTorrentError: (callback) => ipcRenderer.on('torrent-error', callback),
  removeTorrentProgress: (callback) =>
    ipcRenderer.removeListener('torrent-progress', callback),
  removeTorrentDone: (callback) =>
    ipcRenderer.removeListener('torrent-done', callback),
  removeTorrentServerDone: (callback) =>
    ipcRenderer.removeListener('torrent-server-done', callback),
  removeTorrentFile: (callback) =>
    ipcRenderer.removeListener('torrent-file', callback),
  removeTorrentError: (callback) =>
    ipcRenderer.removeListener('torrent-error', callback),
};

contextBridge.exposeInMainWorld('api', api);
