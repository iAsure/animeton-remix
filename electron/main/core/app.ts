import path from 'path';
import { fileURLToPath } from "node:url";
import { app, UtilityProcess, utilityProcess } from 'electron';
import { Worker } from 'worker_threads';
import { createServer } from 'vite';
import log from 'electron-log';

import { APP_ID } from '../../shared/constants/config.js';

import { setupIpcHandlers } from '../ipc/handlers.js';
import { setupProtocol } from './protocol.js';
import { setupShortcuts, unregisterShortcuts } from './shortcuts.js';
import { init as initUpdater } from './updater.js';
import { setupWindow } from './window.js';

let webTorrentProcess: UtilityProcess | null = null;
let subtitlesWorker: Worker | null = null;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeViteServer() {
  if (!process.env.DEV) return undefined;
  
  const viteDevServer = await createServer({
    server: {
      strictPort: true,
      hmr: {
        host: "localhost",
        port: 8888,
        clientPort: 8888,
        protocol: "ws",
      },
    },
  });

  await viteDevServer.listen(5173);
  return viteDevServer;
}

export async function initializeApp() {
  try {
    // Initialize Vite first
    const viteDevServer = await initializeViteServer();
    const build = viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
      // @ts-ignore
      : () => import("../../../app/server/index.js");

    log.info(`Starting app with build ID: ${APP_ID}`);
    app.setAppUserModelId(APP_ID);

    await setupProtocol(build, viteDevServer);

    initUpdater();
    
    // Initialize processes
    webTorrentProcess = utilityProcess.fork('electron/main/services/torrent/client.js');
    subtitlesWorker = new Worker(path.join(__dirname, '../services/subtitles/worker.js'));
    
    const mainWindow = await setupWindow();
    
    await setupIpcHandlers(webTorrentProcess, subtitlesWorker, mainWindow);
    setupShortcuts(mainWindow);

    // Cleanup
    app.on('before-quit', async () => {
      log.info('Cleaning up workers...');
      unregisterShortcuts();
      if (subtitlesWorker) await subtitlesWorker.terminate();
      if (webTorrentProcess) webTorrentProcess.kill();
    });

    return { webTorrentProcess, subtitlesWorker };
  } catch (error) {
    log.error('Failed to initialize application:', error);
    throw error;
  }
}