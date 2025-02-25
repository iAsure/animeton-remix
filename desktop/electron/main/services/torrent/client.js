import path from 'path';
import os from 'os';
import fs from 'fs';
import { parentPort } from 'worker_threads';
import log from 'electron-log';
import { humanizeDuration } from '../../../shared/utils/time.js';
import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';
import http from 'http';
import net from 'net';
import fetch from 'node-fetch';

/** @type {import('webtorrent').Instance} */
let activeClient = null;
let progressInterval = null;
let torrentServer = null;
let isInitializing = false;
let serverClosing = false;
let activeTorrentInfoHash = null;

const TORRENT_TYPES = {
  PLAYBACK: 'playback',
  AUTOCLEAN: 'autoclean',
};

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
      const request = http.get(
        `http://localhost:${port}/webtorrent`,
        {
          timeout: 10_000,
        },
        (response) => {
          response.destroy();
          resolve(response.statusCode === 200);
        }
      );

      request.on('error', (err) => {
        log.error('Server health check error (HTTP):', err.message);
        resolve(false);
      });

      request.on('timeout', () => {
        request.destroy();
        log.error('Server health check timeout (HTTP)');
        resolve(false);
      });
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
    return torrentServer;
  }

  await closeServer();

  for (let attempt = 0; attempt < SERVER_INIT_RETRIES; attempt++) {
    try {
      log.info(
        `Attempting to create torrent server (attempt ${
          attempt + 1
        }/${SERVER_INIT_RETRIES})`
      );

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

        activeClient.setMaxListeners(100);

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

async function readConfigFile() {
  try {
    const configPath = path.join(
      process.env.APPDATA,
      'anitorrent',
      'config.json'
    );
    const configData = await fs.promises.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    if (config?.preferences?.speedLimits) {
      config.preferences.speedLimits.download = Math.round(
        config.preferences.speedLimits.download || 5
      );
      config.preferences.speedLimits.upload = Math.round(
        config.preferences.speedLimits.upload || 5
      );
    }

    return config;
  } catch (error) {
    log.error('Error reading config file:', error);
    return {
      preferences: {
        speedLimits: {
          download: 5,
          upload: 5,
        },
      },
    };
  }
}

async function initializeWebTorrentClient() {
  if (isInitializing) {
    log.info('Client initialization already in progress, waiting...');
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (activeClient && torrentServer) {
      return { client: activeClient, instance: torrentServer };
    }
  }

  isInitializing = true;

  try {
    if (!activeClient) {
      const { default: WebTorrent } = await import('webtorrent');
      const config = await readConfigFile();
      const downloadLimit = config?.preferences?.speedLimits?.download || 5;
      const uploadLimit = config?.preferences?.speedLimits?.upload || 5;

      activeClient = new WebTorrent({
        downloadLimit: downloadLimit * 1048576,
        uploadLimit: uploadLimit * 1572864,
        torrentPort: 0,
        maxConns: 100,
        dht: true,
        natUpnp: true,
      });

      activeClient.setMaxListeners(100);

      log.info('WebTorrent client initialized with speed limits:', {
        downloadLimit,
        uploadLimit,
      });

      setInterval(() => {
        sendActiveTorrentsUpdate();
      }, 1000);
    }

    if (!torrentServer) {
      const instance = await createTorrentServer(activeClient);
      if (!instance) {
        throw new Error(
          'Failed to create torrent server after multiple attempts'
        );
      }
    }

    return { client: activeClient, instance: torrentServer };
  } catch (error) {
    log.error('Failed to initialize WebTorrent client:', error);

    if (!activeClient) {
      const { default: WebTorrent } = await import('webtorrent');
      activeClient = new WebTorrent({
        downloadLimit: 5 * 1048576,
        uploadLimit: 5 * 1572864,
        torrentPort: 0,
        maxConns: 100,
        dht: true,
        natUpnp: true,
      });
    }

    process.parentPort?.postMessage({
      type: IPC_CHANNELS.TORRENT.ERROR,
      data: { error: error.message || 'Error initializing torrent client' },
    });

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

  if (activeClient) {
    activeClient.torrents.forEach((torrent) => {
      if (torrent._customHandlers) {
        torrent.removeListener('done', torrent._customHandlers.done);
        torrent.removeListener('error', torrent._customHandlers.error);
        delete torrent._customHandlers;
      }
    });
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

  sendProgressUpdate(torrent);

  if (progressInterval) {
    clearInterval(progressInterval);
  }

  progressInterval = setInterval(() => {
    if (torrent.infoHash === activeTorrentInfoHash) {
      sendProgressUpdate(torrent);
    }
  }, 500);

  if (torrent._customHandlers) {
    torrent.removeListener('done', torrent._customHandlers.done);
    torrent.removeListener('error', torrent._customHandlers.error);
    delete torrent._customHandlers;
  }

  const doneHandler = async () => {
    await verifyDownload(filePath, torrent);

    if (torrent.infoHash === activeTorrentInfoHash) {
      process.parentPort?.postMessage({ type: IPC_CHANNELS.TORRENT.DONE });
      sendProgressUpdate(torrent);
    }

    if (filePath.toLowerCase().endsWith('.mkv')) {
      await handleMkvSubtitles(filePath);
    }
  };

  const errorHandler = (error) => {
    if (torrent.infoHash === activeTorrentInfoHash) {
      process.parentPort?.postMessage({
        type: IPC_CHANNELS.TORRENT.ERROR,
        data: { error: error.message },
      });
    }
  };

  torrent.removeAllListeners('done');
  torrent.removeAllListeners('error');

  torrent.on('done', doneHandler);
  torrent.on('error', errorHandler);

  torrent._customHandlers = {
    done: doneHandler,
    error: errorHandler,
  };
}

function sendProgressUpdate(torrent) {
  if (
    torrent.torrentType === TORRENT_TYPES.AUTOCLEAN &&
    torrent.infoHash !== activeTorrentInfoHash
  ) {
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
        isBuffering: false,
        ready: true,
      },
    });
    return;
  }

  if (torrent.infoHash !== activeTorrentInfoHash) return;

  const file = torrent?.files[0];

  if (!file) return;

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
  if (torrentUrl.includes('magnet:')) {
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(torrentUrl, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (response.status === 404) {
      throw new Error('Episodio no encontrado');
    }
  } catch (error) {
    log.error('Error validating torrent:', error);

    if (
      error.name === 'AbortError' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNABORTED'
    ) {
      return;
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error(
        'No se pudo acceder al episodio, el servidor no está disponible'
      );
    }

    throw new Error('Torrent no disponible en este momento');
  }
}

function sendActiveTorrentsUpdate() {
  if (!activeClient) return;

  const activeTorrents = activeClient.torrents.map((torrent) => ({
    infoHash: torrent.infoHash,
    name: torrent.name,
    created: torrent.created,
    progress: {
      numPeers: torrent.numPeers,
      downloaded: torrent.downloaded,
      total: torrent.length,
      progress: torrent.progress,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      remaining: torrent.done
        ? 'Completado'
        : humanizeDuration(torrent.timeRemaining),
      isBuffering: torrent.progress < 0.01,
      ready: torrent.progress > 0.01,
      isPaused: torrent.paused,
    },
  }));

  process.parentPort?.postMessage({
    type: IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS,
    data: activeTorrents,
  });
}

process.parentPort?.on('message', async (message) => {
  const eventMessage = message.data;

  try {
    switch (eventMessage.type) {
      case IPC_CHANNELS.TORRENT.ADD:
        await handleAddTorrent({
          ...eventMessage.data,
          type: eventMessage.data.fromAutoclean
            ? TORRENT_TYPES.AUTOCLEAN
            : TORRENT_TYPES.PLAYBACK,
        });
        break;

      case IPC_CHANNELS.TORRENT.PAUSE:
        const pauseResult = await handlePauseTorrent(
          eventMessage?.data.payload
        );
        process.parentPort?.postMessage({
          type: IPC_CHANNELS.TORRENT.PAUSE,
          data: pauseResult,
        });
        break;

      case IPC_CHANNELS.TORRENT.REMOVE:
        const removeResult = await handleRemoveTorrent(
          eventMessage?.data.infoHash
        );
        break;

      case IPC_CHANNELS.TORRENT.GET_ACTIVE_TORRENTS:
        sendActiveTorrentsUpdate();
        break;

      case IPC_CHANNELS.TORRENT.CHECK_SERVER:
        const serverStatus = await handleCheckServer();
        process.parentPort?.postMessage({
          type: IPC_CHANNELS.TORRENT.SERVER_STATUS,
          data: serverStatus,
        });
        break;

      case IPC_CHANNELS.TORRENT.SET_SPEED_LIMITS:
        await handleSetSpeedLimits(eventMessage.data);
        break;

      default:
        log.warn('Unknown message:', message);
    }
  } catch (error) {
    process.parentPort?.postMessage({
      type: IPC_CHANNELS.TORRENT.ERROR,
      data: { error: error.message },
    });
  }
});

async function handleAddTorrent({
  torrentUrl,
  torrentHash,
  type = TORRENT_TYPES.PLAYBACK,
}) {
  try {
    const { client, instance } = await initializeWebTorrentClient();

    const dupTorrent = client.torrents.find(
      (torrent) => torrent.infoHash === torrentHash
    );

    if (dupTorrent) {
      log.info('Duplicate torrent found, using existing torrent');
      dupTorrent.setMaxListeners(30);
      if (type === TORRENT_TYPES.PLAYBACK) {
        await handleTorrent(dupTorrent, instance);
      }
      return;
    }

    await validateTorrent(torrentUrl);

    client.add(torrentUrl, { announce: ANNOUNCE }, (torrent) => {
      torrent.setMaxListeners(30);
      torrent.torrentType = type;

      torrent.on('error', (err) => {
        log.error('Torrent error:', err);
        process.parentPort?.postMessage({
          type: IPC_CHANNELS.TORRENT.ERROR,
          data: { error: err.message || 'Error en el torrent' },
        });
      });

      if (type === TORRENT_TYPES.PLAYBACK) {
        torrent.critical(0, torrent.pieces.length - 1);
        handleTorrent(torrent, instance).catch((error) => {
          log.error('Error handling torrent:', error);
          process.parentPort?.postMessage({
            type: IPC_CHANNELS.TORRENT.ERROR,
            data: { error: error.message || 'Error handling torrent' },
          });
        });
      } else {
        sendProgressUpdate(torrent);
        torrent.on('done', () => {
          sendProgressUpdate(torrent);
        });
      }

      client.torrents
        .filter((t) => t !== torrent)
        .forEach((t) => {
          t.critical(0, 0);
          t.unchokeSlots = 2;
        });
    });
  } catch (error) {
    log.error('Error adding torrent:', error);
    process.parentPort?.postMessage({
      type: IPC_CHANNELS.TORRENT.ERROR,
      data: {
        error: error?.message || 'Error al agregar el torrent',
      },
    });
    throw error;
  }
}

async function handleCheckServer() {
  const isHealthy = await checkServerHealth();
  return {
    active: isHealthy,
    port: torrentServer?.server.address().port,
  };
}

async function handlePauseTorrent({ infoHash, torrentUrl }) {
  const torrent = activeClient?.torrents.find((t) => t.infoHash === infoHash);
  if (!torrent) {
    await handleAddTorrent({ torrentUrl, torrentHash: infoHash });
    sendActiveTorrentsUpdate();
    return {
      success: true,
      isPaused: false,
      infoHash,
    };
  }

  torrent.destroy();
  activeTorrentInfoHash = null;

  sendActiveTorrentsUpdate();

  return {
    success: true,
    isPaused: true,
    infoHash,
  };
}

async function handleRemoveTorrent(infoHash) {
  const torrent = activeClient?.torrents.find((t) => t.infoHash === infoHash);
  if (!torrent) throw new Error(`Torrent ${infoHash} not found`);

  torrent.destroy();
  sendActiveTorrentsUpdate();

  return {
    success: true,
    infoHash,
  };
}

async function handleSetSpeedLimits({ downloadLimit, uploadLimit }) {
  if (!activeClient) {
    throw new Error('No hay cliente activo');
  }

  const downloadNum = Math.round(downloadLimit);
  const uploadNum = Math.round(uploadLimit);

  const downloadBytes = downloadNum * 1048576;
  const uploadBytes = uploadNum * 1572864;

  activeClient.throttleDownload(downloadBytes);
  activeClient.throttleUpload(uploadBytes);

  log.info('Speed limits updated:', {
    downloadLimit: downloadNum,
    uploadLimit: uploadNum,
  });
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
