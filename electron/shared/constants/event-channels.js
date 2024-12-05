export const IPC_CHANNELS = {
    TORRENT: {
      ADD: 'webtorrent-action',
      PROGRESS: 'torrent-progress',
      DONE: 'torrent-done',
      SERVER_DONE: 'torrent-server-done',
      FILE: 'torrent-file',
      ERROR: 'torrent-error',
      MKV_PROCESS: 'process-mkv',
      MKV_ERROR: 'process-mkv-error'
    },
    SUBTITLES: {
      EXTRACT: 'extract-subtitles',
      EXTRACTED: 'subtitles-extracted',
      ERROR: 'subtitles-error'
    }
  };