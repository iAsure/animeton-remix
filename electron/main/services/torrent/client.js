import path from 'path';
import os from 'os';
import fs from 'fs';
import { parentPort } from 'worker_threads';
import log from 'electron-log';
import { humanizeDuration } from '../../../shared/utils/time.js';
import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';

let activeClient = null;
let progressInterval = null;

const ANNOUNCE = [
  atob('d3NzOi8vdHJhY2tlci5vcGVud2VidG9ycmVudC5jb20='),
  atob('d3NzOi8vdHJhY2tlci53ZWJ0b3JyZW50LmRldg=='),
  atob('d3NzOi8vdHJhY2tlci5maWxlcy5mbTo3MDczL2Fubm91bmNl'),
  atob('d3NzOi8vdHJhY2tlci5idG9ycmVudC54eXov'),
  atob('dWRwOi8vb3Blbi5zdGVhbHRoLnNpOjgwL2Fubm91bmNl'),
  atob('aHR0cDovL255YWEudHJhY2tlci53Zjo3Nzc3L2Fubm91bmNl'),
  atob('dWRwOi8vdHJhY2tlci5vcGVudHJhY2tyLm9yZzoxMzM3L2Fubm91bmNl'),
  atob('dWRwOi8vZXhvZHVzLmRlc3luYy5jb206Njk2OS9hbm5vdW5jZQ=='),
  atob('dWRwOi8vdHJhY2tlci5jb3BwZXJzdXJmZXIudGs6Njk2OS9hbm5vdW5jZQ=='),
  atob('dWRwOi8vOS5yYXJiZy50bzoyNzEwL2Fubm91bmNl'),
  atob('dWRwOi8vdHJhY2tlci50b3JyZW50LmV1Lm9yZzo0NTEvYW5ub3VuY2U='),
  atob('aHR0cDovL29wZW4uYWNnbnh0cmFja2VyLmNvbTo4MC9hbm5vdW5jZQ=='),
  atob('aHR0cDovL2FuaWRleC5tb2U6Njk2OS9hbm5vdW5jZQ=='),
  atob('aHR0cDovL3RyYWNrZXIuYW5pcmVuYS5jb206ODAvYW5ub3VuY2U='),
];

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
  activeClient = new WebTorrent({
    downloadLimit: 5 * 1048576 || 0,
    uploadLimit: 5 * 1572864 || 0,
    torrentPort: 0,
    maxConns: 100,
    dht: true,
    natUpnp: true,
  });
  const instance = activeClient.createServer();

  // Initialize server on random port
  instance.server.listen(0, () => {
    const port = instance.server.address().port;
  });

  return { client: activeClient, instance };
}

async function handleTorrent(torrent, instance) {
  const fileName = encodeURIComponent(torrent.files[0].name);
  const url = `http://localhost:${instance.server.address().port}/webtorrent/${
    torrent.infoHash
  }/${fileName}`;

  const filePath = path.join(
    process.env.TEMP || process.env.TMP || os.tmpdir(),
    'webtorrent',
    torrent.files[0].name
  );

  process.parentPort?.postMessage({
    type: IPC_CHANNELS.TORRENT.SERVER_DONE,
    data: { url, filePath },
  });

  // Send initial progress for completed torrents
  if (torrent.progress === 1) {
    sendProgressUpdate(torrent);
  }

  // Setup progress updates
  progressInterval = setInterval(() => {
    sendProgressUpdate(torrent);
  }, 500);

  // Handle torrent completion
  torrent.on('done', async () => {
    await verifyDownload(filePath, torrent);
    clearInterval(progressInterval);

    process.parentPort?.postMessage({ type: IPC_CHANNELS.TORRENT.DONE });

    // Handle MKV files
    if (filePath.toLowerCase().endsWith('.mkv')) {
      await handleMkvSubtitles(filePath);
    }
  });
}

// Helper function to send progress updates
function sendProgressUpdate(torrent) {
  // Calculate ranges for the file
  const file = torrent.files[0];
  const startPiece = file._startPiece;
  const endPiece = file._endPiece;
  const numPieces = endPiece - startPiece + 1;

  // For completed torrents, send a single full range
  const ranges =
    torrent.progress === 1
      ? [{ start: 0, end: 1 }]
      : calculateRanges(torrent, startPiece, endPiece, numPieces);

  // Send download ranges
  process.parentPort?.postMessage({
    type: IPC_CHANNELS.TORRENT.DOWNLOAD_RANGES,
    data: {
      ranges,
      downloaded: torrent.downloaded,
      total: torrent.length,
      progress: torrent.progress,
      fileProgress: {
        startPiece,
        endPiece,
        numPieces,
        numPiecesPresent: numPieces, // For completed torrents, all pieces are present
      },
    },
  });

  // Send regular progress update
  process.parentPort?.postMessage({
    type: IPC_CHANNELS.TORRENT.PROGRESS,
    data: {
      numPeers: torrent.numPeers,
      downloaded: torrent.downloaded,
      total: torrent.length,
      progress: torrent.progress,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      remaining: torrent.done
        ? 'Done'
        : humanizeDuration(torrent.timeRemaining),
      isBuffering: torrent.progress < 0.01,
      ready: torrent.progress > 0.01,
    },
  });
}

// Helper function to calculate ranges for incomplete torrents
function calculateRanges(torrent, startPiece, endPiece, numPieces) {
  const ranges = [];
  let lastStart = null;

  for (let piece = startPiece; piece <= endPiece; piece++) {
    const piecePresent = torrent.bitfield.get(piece);
    const normalizedPiece = piece - startPiece;

    if (piecePresent && lastStart === null) {
      lastStart = normalizedPiece / numPieces;
    } else if (!piecePresent && lastStart !== null) {
      ranges.push({
        start: lastStart,
        end: normalizedPiece / numPieces,
      });
      lastStart = null;
    }
  }

  if (lastStart !== null) {
    ranges.push({
      start: lastStart,
      end: 1,
    });
  }

  return ranges;
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('File verification failed after maximum attempts');
}

async function handleMkvSubtitles(filePath) {
  try {
    // Verify file exists before processing
    await fs.promises.access(filePath).catch(() => {
      return;
    });

    process.parentPort?.postMessage({
      type: IPC_CHANNELS.TORRENT.MKV_PROCESS,
      data: {
        filePath,
        status: 'ready_for_subtitles',
      },
    });
  } catch (error) {
    process.parentPort?.postMessage({
      type: IPC_CHANNELS.TORRENT.ERROR,
      data: {
        error: error.message,
        filePath,
      },
    });
  }
}

// Message handler
process.parentPort?.on('message', async (message) => {
  if (message.data?.action === 'add-torrent') {
    try {
      const { client, instance } = await initializeWebTorrentClient();
      client.add(message.data.torrentId, { announce: ANNOUNCE }, (torrent) => {
        handleTorrent(torrent, instance).catch((error) => {
          log.error('Error handling torrent:', error);
        });
      });
    } catch (error) {
      log.error('Error initializing WebTorrent:', error);
      process.parentPort?.postMessage({
        type: 'torrent-error',
        data: { error: error.message },
      });
    }
  }
});

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
