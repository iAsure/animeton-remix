import path from 'path';
import os from 'os';
import fs from 'fs';
import { parentPort } from 'worker_threads';
import log from 'electron-log';
import { humanizeDuration } from '../../../shared/utils/time.js';

let activeClient = null;
let progressInterval = null;

async function cleanup() {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  if (activeClient) {
    await activeClient.destroy();
    activeClient = null;
  }
}

async function initializeWebTorrentClient() {
  await cleanup();
  const { default: WebTorrent } = await import('webtorrent');
  activeClient = new WebTorrent();
  const instance = activeClient.createServer();

  // Initialize server on random port
  instance.server.listen(0, () => {
    const port = instance.server.address().port;
    process.parentPort?.postMessage({ type: 'server-ready', port });
  });

  return { client: activeClient, instance };
}

async function handleTorrent(torrent, instance) {
  const fileName = encodeURIComponent(torrent.files[0].name);
  const url = `http://localhost:${
    instance.server.address().port
  }/webtorrent/${torrent.infoHash}/${fileName}`;

  // Setup progress updates
  const progressInterval = setInterval(() => {
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

  // Handle torrent completion
  torrent.on('done', async () => {
    const filePath = path.join(
      process.env.TEMP || process.env.TMP || os.tmpdir(),
      'webtorrent',
      torrent.files[0].name
    );

    await verifyDownload(filePath, torrent);
    clearInterval(progressInterval);

    process.parentPort?.postMessage({ type: 'torrent-done' });
    process.parentPort?.postMessage({
      type: 'torrent-server-done',
      data: { url, filePath },
    });

    // Handle MKV files
    if (filePath.toLowerCase().endsWith('.mkv')) {
      await handleMkvFile(filePath);
    }
  });
}

async function verifyDownload(filePath, torrent, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size === torrent.files[0].length) {
        return true;
      }
    } catch (error) {
      log.warn(`Attempt ${attempt + 1}: File verification failed`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('File verification failed after maximum attempts');
}

async function handleMkvFile(filePath) {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.parentPort?.postMessage({
      type: 'process-mkv',
      data: { filePath, status: 'starting' },
    });
  } catch (error) {
    process.parentPort?.postMessage({
      type: 'process-mkv-error',
      data: { error: error.message, filePath }
    });
  }
}

// Message handler
process.parentPort?.on('message', async (message) => {
  if (message.data?.action === 'add-torrent') {
    try {
      const { client, instance } = await initializeWebTorrentClient();
      client.add(message.data.torrentId, (torrent) => {
        handleTorrent(torrent, instance).catch(error => {
          log.error('Error handling torrent:', error);
        });
      });
    } catch (error) {
      log.error('Error initializing WebTorrent:', error);
      process.parentPort?.postMessage({
        type: 'torrent-error',
        data: { error: error.message }
      });
    }
  }
});

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);