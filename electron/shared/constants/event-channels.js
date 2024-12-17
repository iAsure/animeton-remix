export const IPC_CHANNELS = {
  TORRENT: {
    ADD: 'webtorrent-action',
    PROGRESS: 'torrent-progress',
    DONE: 'torrent-done',
    SERVER_DONE: 'torrent-server-done',
    FILE: 'torrent-file',
    ERROR: 'torrent-error',
    MKV_PROCESS: 'process-mkv',
    MKV_ERROR: 'process-mkv-error',
  },
  SUBTITLES: {
    EXTRACT: 'extract-subtitles',
    EXTRACTED: 'subtitles-extracted',
    ERROR: 'subtitles-error',
  },
  WINDOW: {
    MAXIMIZE: 'window-maximize',
    UNMAXIMIZE: 'window-unmaximize',
    RESIZE: 'window-resize',
    CONTROL: 'window-control',
    IS_MAXIMIZED: 'window-is-maximized',
    SET_FULLSCREEN: 'window:set-fullscreen',
    FULLSCREEN_CHANGE: 'window:fullscreen-change',
  },
  SHELL: {
    OPEN_EXTERNAL: 'shell-open-external',
  },
  CONFIG: {
    GET: 'config:get',
    SET: 'config:set',
    UPDATE: 'config:update',
    CHANGED: 'config:changed',
  },
  UPDATER: {
    DOWNLOADED: 'update-downloaded',
    AVAILABLE: 'update-available',
    NOT_AVAILABLE: 'update-not-available',
    CHECKING_FOR_UPDATE: 'update-checking-for-update',
    ERROR: 'update-error',
  },
};
