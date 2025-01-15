import path from 'path';
import os from 'os';
import fs from 'fs';
import { parentPort } from 'worker_threads';
import log from 'electron-log';
import { humanizeDuration } from '../../../shared/utils/time.js';
import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';
import http from 'http';

/** @type {import('webtorrent').Instance} */
let activeClient = null;
let progressInterval = null;
let torrentServer = null;
let isInitializing = false;
let serverClosing = false;
let activeTorrentInfoHash = null;

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

const SERVER_INIT_RETRIES = 3;
const SERVER_INIT_DELAY = 1000;

async function checkServerHealth() {
  if (!torrentServer) return false;

  try {
    const port = torrentServer.server.address()?.port;
    if (!port) return false;

    log.info(`Checking server health on port ${port}`);

    const isHealthy = await new Promise((resolve) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: port,
          path: '/webtorrent',
          method: 'GET',
          timeout: 1000,
        },
        (res) => {
          resolve(true);
        }
      );

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });

    log.info(`Server health check result: ${isHealthy}`);
    return isHealthy;
  } catch (error) {
    log.error('Server health check failed:', error);
    return false;
  }
}

async function closeServer() {
  if (!torrentServer || serverClosing) return;

  serverClosing = true;
  try {
    log.info('Closing existing server...');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        serverClosing = false;
        reject(new Error('Server close timeout'));
      }, 5000);

      torrentServer.close(() => {
        clearTimeout(timeout);
        torrentServer = null;
        serverClosing = false;
        resolve(true);
      });
    });
  } catch (error) {
    log.error('Error closing server:', error);
    serverClosing = false;
    torrentServer = null;
  }
}

/**
 * Create a torrent server
 * @param {import('webtorrent').Instance} client
 */
async function createTorrentServer(client) {
  if (torrentServer) {
    const isHealthy = await checkServerHealth();
    if (isHealthy) {
      log.info('Using existing healthy server');
      return torrentServer;
    }
  }

  // Ensure any existing server is properly closed
  await closeServer();

  for (let attempt = 0; attempt < SERVER_INIT_RETRIES; attempt++) {
    try {
      log.info(
        `Attempting to create torrent server (attempt ${
          attempt + 1
        }/${SERVER_INIT_RETRIES})`
      );

      // Destroy and recreate client if server creation fails
      if (attempt > 0) {
        log.info('Recreating WebTorrent client...');
        if (activeClient) {
          await activeClient.destroy();
        }
        const { default: WebTorrent } = await import('webtorrent');
        activeClient = new WebTorrent({
          downloadLimit: 5 * 1048576 || 0,
          uploadLimit: 5 * 1572864 || 0,
          torrentPort: 0,
          maxConns: 100,
          dht: true,
          natUpnp: true,
        });
        client = activeClient;
      }

      const instance = client.createServer();

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server initialization timeout'));
        }, 5000);

        instance.server.listen(0, 'localhost', async () => {
          clearTimeout(timeout);
          torrentServer = instance;

          const port = instance.server.address()?.port;
          if (!port) {
            reject(new Error('Server initialized without port'));
            return;
          }

          log.info(`Torrent server listening on port ${port}`);

          // Add small delay before health check
          await new Promise((resolve) => setTimeout(resolve, 100));

          const isHealthy = await checkServerHealth();
          if (!isHealthy) {
            reject(
              new Error('Server health check failed after initialization')
            );
            return;
          }

          process.parentPort?.postMessage({
            type: IPC_CHANNELS.TORRENT.SERVER_STATUS,
            data: {
              active: true,
              port,
            },
          });

          resolve(instance);
        });
      });

      return torrentServer;
    } catch (error) {
      log.error(`Server creation attempt ${attempt + 1} failed:`, error);

      if (attempt < SERVER_INIT_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, SERVER_INIT_DELAY));
      } else {
        throw error;
      }
    }
  }
}

async function initializeWebTorrentClient() {
  if (isInitializing) {
    log.info('Client initialization already in progress, waiting...');
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (activeClient && torrentServer && (await checkServerHealth())) {
      log.info('Using existing healthy client and server');
      return { client: activeClient, instance: torrentServer };
    }
  }

  isInitializing = true;

  try {
    if (!activeClient || !torrentServer || !(await checkServerHealth())) {
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
    }

    const instance = await createTorrentServer(activeClient);

    if (!instance) {
      throw new Error(
        'Failed to create torrent server after multiple attempts'
      );
    }

    return { client: activeClient, instance };
  } catch (error) {
    log.error('Failed to initialize WebTorrent client:', error);
    await cleanup();
    throw error;
  } finally {
    isInitializing = false;
  }
}

async function cleanup() {
  log.info('Starting cleanup...');

  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }

  await closeServer();

  if (activeClient) {
    log.info('Destroying active client...');
    await activeClient.destroy();
    activeClient = null;
  }

  process.parentPort?.postMessage({
    type: IPC_CHANNELS.TORRENT.SERVER_STATUS,
    data: { active: false },
  });

  log.info('Cleanup completed');
}

/**
 * Handle torrent
 * @param {import('webtorrent').Torrent} torrent
 * @param {import('webtorrent').BrowserServer} instance
 */
async function handleTorrent(torrent, instance) {
  activeTorrentInfoHash = torrent.infoHash;

  const isHealthy = await checkServerHealth();
  if (!isHealthy) {
    throw new Error('Torrent server is not healthy');
  }

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
    data: { url, filePath, infoHash: torrent.infoHash },
  });

  if (torrent.progress === 1) {
    sendProgressUpdate(torrent);
  }

  if (progressInterval) {
    clearInterval(progressInterval);
  }

  progressInterval = setInterval(() => {
    if (torrent.infoHash === activeTorrentInfoHash) {
      sendProgressUpdate(torrent);
    }
  }, 500);

  torrent.on('done', async () => {
    await verifyDownload(filePath, torrent);

    if (torrent.infoHash === activeTorrentInfoHash) {
      process.parentPort?.postMessage({ type: IPC_CHANNELS.TORRENT.DONE });
    }

    if (filePath.toLowerCase().endsWith('.mkv')) {
      await handleMkvSubtitles(filePath);
    }
  });

  torrent.on('error', (error) => {
    if (torrent.infoHash === activeTorrentInfoHash) {
      process.parentPort?.postMessage({
        type: IPC_CHANNELS.TORRENT.ERROR,
        data: { error: error.message },
      });
    }
  });
}

function sendProgressUpdate(torrent) {
  if (torrent.infoHash !== activeTorrentInfoHash) return;

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
        numPiecesPresent: numPieces,
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

// Helper function to calculate progress ranges
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

async function validateTorrent(torrentUrl) {
  try {
    const response = await fetch(torrentUrl);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

// Message handler
process.parentPort?.on('message', async (message) => {
  if (message.data?.action === 'add-torrent') {
    try {
      const { client, instance } = await initializeWebTorrentClient();

      if (!client || !instance) {
        throw new Error('Failed to initialize torrent client');
      }

      const dupTorrent = client.torrents.find(
        (torrent) => torrent.infoHash === message.data.torrentHash
      );

      log.info('Torrents', client.torrents.map((t) => ({ created: t.created, infoHash: t.infoHash, name: t.name })));
      log.info('torrentHashes', client.torrents.map((t) => t.infoHash));
      log.info('Received torrent hash:', message.data.torrentHash);

      if (dupTorrent) {
        log.info('Duplicate torrent found, using existing torrent');
        return handleTorrent(dupTorrent, instance);
      }

      await validateTorrent(message.data.torrentUrl);

      client.add(message.data.torrentUrl, { announce: ANNOUNCE }, (torrent) => {
        handleTorrent(torrent, instance).catch((error) => {
          log.error('Error handling torrent:', error);
          process.parentPort?.postMessage({
            type: IPC_CHANNELS.TORRENT.ERROR,
            data: { error: error.message },
          });
        });
      });
    } catch (error) {
      log.error('Error initializing WebTorrent:', error);
      process.parentPort?.postMessage({
        type: IPC_CHANNELS.TORRENT.ERROR,
        data: { error: 'Episodio no disponible en este momento' },
      });
    }
  } else if (message.data?.action === 'check-server') {
    // Add server health check handler
    const isHealthy = await checkServerHealth();
    process.parentPort?.postMessage({
      type: IPC_CHANNELS.TORRENT.SERVER_STATUS,
      data: {
        active: isHealthy,
        port: torrentServer?.server.address().port,
      },
    });
  }
});

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
