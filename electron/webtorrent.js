import path from 'path';
import os from 'os';
import fs from 'fs';

/**
 * @param {number} milliseconds
 */
function humanizeDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''}`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;

  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

/**
 * @param {string} torrentId
 */
async function handleAddTorrent(torrentId) {
  const { default: WebTorrent } = await import('webtorrent');
  const client = new WebTorrent();
  const instance = client.createServer();
  instance.server.listen(0, () => {
    const port = instance.server.address().port;
    process.parentPort?.postMessage({ type: 'server-ready', port });
  });

  client.add(torrentId, async (torrent) => {
    const fileName = encodeURIComponent(torrent.files[0].name);
    const url = `http://localhost:${
      instance.server.address().port
    }/webtorrent/${torrent.infoHash}/${fileName}`;

    torrent.on('done', async () => {
      const filePath = path.join(
        process.env.TEMP || process.env.TMP || os.tmpdir(),
        'webtorrent',
        torrent.files[0].name
      );

      // Wait for file to be completely written
      const maxAttempts = 10;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        try {
          const stats = await fs.promises.stat(filePath);
          if (stats.size === torrent.files[0].length) {
            process.parentPort?.postMessage({ type: 'torrent-done' });
            process.parentPort?.postMessage({
              type: 'torrent-server-done',
              data: {
                url,
                filePath,
              },
            });

            if (filePath.toLowerCase().endsWith('.mkv')) {
              try {
                // Add small delay to ensure file is fully accessible
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Notify that we're starting MKV processing
                process.parentPort?.postMessage({
                  type: 'process-mkv',
                  data: { 
                    filePath,
                    status: 'starting'
                  },
                });
              } catch (error) {
                process.parentPort?.postMessage({
                  type: 'process-mkv-error',
                  data: { 
                    error: error.message,
                    filePath 
                  }
                });
              }
            }
            break;
          }
        } catch (error) {
          console.error(`Attempt ${attempts + 1}: File not ready yet`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (attempts === maxAttempts) {
        process.parentPort?.postMessage({
          type: 'torrent-error',
          data: { error: 'File not ready after maximum attempts' }
        });
      }
    });

    setInterval(() => {
      process.parentPort?.postMessage({
        type: 'torrent-progress',
        data: {
          numPeers: torrent.numPeers,
          downloaded: torrent.downloaded,
          total: torrent.length,
          progress: torrent.progress,
          downloadSpeed: torrent.downloadSpeed,
          uploadSpeed: torrent.uploadSpeed,
          remaining: torrent.done
            ? 'Done.'
            : humanizeDuration(torrent.timeRemaining),
        },
      });
    }, 500);
  });
}

process.parentPort?.on('message', (message) => {
  if (message.data.action === 'add-torrent') {
    handleAddTorrent(message.data.torrentId);
  }
});
