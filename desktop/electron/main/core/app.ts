import { app, BrowserWindow, UtilityProcess, utilityProcess } from 'electron';
import log from 'electron-log';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { Worker } from 'worker_threads';

import { APP_ID } from '../../shared/constants/config.js';
import { AppConfig } from '../../shared/types/config.js';

import { ConfigService } from '../services/config/service.js';
import { uploadLogFile } from '../services/logs/uploader.js';
import { cleanupTorrentFiles } from '../services/torrent/autoclean.js';

import { createActivationWindow, validateActivationKey } from './activation-window.js';
import { DiscordRPC } from './discord.js';
import { handleProtocolLink } from './protocol.js';

import { setupRemix } from './remix.js';
import { setupShortcuts, unregisterShortcuts } from './shortcuts.js';
import { setupWindow } from './window.js';
import { setupIpcHandlers } from '../ipc/handlers.js';

let webTorrentProcess: UtilityProcess | null = null;
let subtitlesWorker: Worker | null = null;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeViteServer() {
  if (!process.env.DEV) return undefined;

  const viteDevServer = await import('vite').then((vite) =>
    vite.createServer({
      server: {
        strictPort: true,
        hmr: {
          host: 'localhost',
          port: 8888,
          clientPort: 8888,
          protocol: 'ws',
        },
      },
    })
  );

  await viteDevServer.listen(5173);
  return viteDevServer;
}

export async function initializeApp() {
  try {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
      return;
    }

    if (process.platform === 'win32') {
      app.setAsDefaultProtocolClient('anitorrent');
    }

    app.on('second-instance', (event, argv) => {
      const url = argv.pop();
      handleProtocolLink(url);

      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    const viteDevServer = await initializeViteServer();
    const build = viteDevServer
      ? () => viteDevServer.ssrLoadModule('virtual:remix/server-build')
      : // @ts-ignore
        () => import('../../../app/server/index.js');

    log.info(`Starting app with build ID: ${APP_ID}`);
    app.setAppUserModelId(APP_ID);

    await cleanupTorrentFiles();
    await setupRemix(build, viteDevServer);

    webTorrentProcess = utilityProcess.fork(
      path.join(__dirname, '../services/torrent/client.js')
    );
    subtitlesWorker = new Worker(
      path.join(__dirname, '../services/subtitles/worker.js')
    );

    const tempWindow = new BrowserWindow({ show: false });
    const configService = new ConfigService(tempWindow);
    await configService.initialize();

    const config = await configService.get<AppConfig>();
    const isValid = await validateActivationKey(config?.user?.activationKey);
    log.info(`Activation key status: ${isValid}`);

    const keyExists = config?.user?.activationKey && config?.user?.discordId;
    const appIsActivated = isValid || keyExists;

    let mainWindow;
    if (!appIsActivated && !process.env.DEV) {
      mainWindow = await createActivationWindow();
    } else {
      mainWindow = await setupWindow();
    }

    const deepLinkingUrl = process.argv[process.argv.length - 1];
    if (deepLinkingUrl.startsWith('anitorrent://')) {
      handleProtocolLink(deepLinkingUrl);
    }

    configService.mainWindow = mainWindow;
    tempWindow.destroy();

    const discordRPC = new DiscordRPC(mainWindow);

    await setupIpcHandlers(webTorrentProcess, subtitlesWorker, mainWindow);
    setupShortcuts(mainWindow);

    // Cleanup
    app.on('before-quit', async (event) => {
      event.preventDefault();
      log.info('Cleaning up workers...');
      unregisterShortcuts();

      try {
        discordRPC.destroy();
        await uploadLogFile(mainWindow);
        if (subtitlesWorker) await subtitlesWorker.terminate();
        if (webTorrentProcess) webTorrentProcess.kill();
        app.exit();
      } catch (error) {
        log.error('Error during cleanup:', error);
        app.exit(1);
      }
    });

    return { webTorrentProcess, subtitlesWorker, discordRPC };
  } catch (error) {
    log.error('Failed to initialize application:', error);
    throw error;
  }
}
