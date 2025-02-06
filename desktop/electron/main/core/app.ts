import path from 'path';
import { fileURLToPath } from "node:url";
import { app, UtilityProcess, utilityProcess, BrowserWindow } from 'electron';
import { Worker } from 'worker_threads';
import log from 'electron-log';

import { APP_ID } from '../../shared/constants/config.js';
import { AppConfig } from '../../shared/types/config.js';

import { setupIpcHandlers } from '../ipc/handlers.js';
import { setupProtocol } from './protocol.js';
import { setupShortcuts, unregisterShortcuts } from './shortcuts.js';
import { setupWindow } from './window.js';
import { cleanupTorrentFiles } from '../services/torrent/autoclean.js';
import { DiscordRPC } from './discord.js';
import { createActivationWindow, validateActivationKey } from './activation-window.js';
import { ConfigService } from '../services/config/service.js';

let webTorrentProcess: UtilityProcess | null = null;
let subtitlesWorker: Worker | null = null;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeViteServer() {
  if (!process.env.DEV) return undefined;
  
  const viteDevServer = await import("vite").then((vite) =>
    vite.createServer({
      server: {
        strictPort: true,
        hmr: {
          host: "localhost",
          port: 8888,
          clientPort: 8888,
          protocol: "ws",
        },
      },
    })
  );

  await viteDevServer.listen(5173);
  return viteDevServer;
}

export async function initializeApp() {
  try {
    const viteDevServer = await initializeViteServer();
    const build = viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
      // @ts-ignore
      : () => import("../../../app/server/index.js");

    log.info(`Starting app with build ID: ${APP_ID}`);
    app.setAppUserModelId(APP_ID);
    
    await cleanupTorrentFiles();
    await setupProtocol(build, viteDevServer);

    webTorrentProcess = utilityProcess.fork(path.join(__dirname, '../services/torrent/client.js'));
    subtitlesWorker = new Worker(path.join(__dirname, '../services/subtitles/worker.js'));

    const tempWindow = new BrowserWindow({ show: false });
    const configService = new ConfigService(tempWindow);
    await configService.initialize();
    
    const config = await configService.get<AppConfig>();
    const isValid = await validateActivationKey(config?.user?.activationKey);
    log.info(`Activation key status: ${isValid}`);

    let mainWindow;
    if (!isValid && !process.env.DEV) {
      mainWindow = await createActivationWindow();
    } else {
      mainWindow = await setupWindow();
    }

    configService.mainWindow = mainWindow;
    tempWindow.destroy();

    const discordRPC = new DiscordRPC(mainWindow);
    
    await setupIpcHandlers(webTorrentProcess, subtitlesWorker, mainWindow);
    setupShortcuts(mainWindow);

    // Cleanup
    app.on('before-quit', async () => {
      log.info('Cleaning up workers...');
      unregisterShortcuts();
      discordRPC.destroy();
      if (subtitlesWorker) await subtitlesWorker.terminate();
      if (webTorrentProcess) webTorrentProcess.kill();
    });

    return { webTorrentProcess, subtitlesWorker, discordRPC };
  } catch (error) {
    log.error('Failed to initialize application:', error);
    throw error;
  }
}
