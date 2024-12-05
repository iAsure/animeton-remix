import { app } from 'electron';
import log from 'electron-log';
import { setupWindow } from './window.js';
import { setupProtocol } from './protocol.js';
import { setupIpcHandlers } from '../ipc/handlers.js';
import { Worker } from 'worker_threads';
import { utilityProcess } from 'electron';
import path from 'path';
import { fileURLToPath } from "node:url";
import { createServer } from 'vite';
import { init as initUpdater } from './updater.js';

let webTorrentProcess = null;
let subtitlesWorker = null;
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

    log.info(`Starting app with build ID: ${process.env.APP_ID}`);
    app.setAppUserModelId(process.env.APP_ID);

    await setupProtocol(build, viteDevServer);

    initUpdater();
    
    // Initialize processes
    webTorrentProcess = utilityProcess.fork('electron/main/services/torrent/client.js');
    subtitlesWorker = new Worker(path.join(__dirname, '../services/subtitles/worker.js'));
    
    const mainWindow = await setupWindow();
    
    setupIpcHandlers(webTorrentProcess, subtitlesWorker, mainWindow);

    // Cleanup
    app.on('before-quit', async () => {
      log.info('Cleaning up workers...');
      if (subtitlesWorker) await subtitlesWorker.terminate();
      if (webTorrentProcess) await webTorrentProcess.kill();
    });

    return { webTorrentProcess, subtitlesWorker };
  } catch (error) {
    log.error('Failed to initialize application:', error);
    throw error;
  }
}