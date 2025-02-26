import { app, BrowserWindow, UtilityProcess, utilityProcess } from 'electron';
import log from 'electron-log';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { Worker } from 'worker_threads';

import { APP_ID } from '../../shared/constants/config.js';
import { IPC_CHANNELS } from '../../shared/constants/event-channels.js';
import { AppConfig } from '../../shared/types/config.js';

import { ConfigService } from '../services/config/service.js';
import { uploadLogFile } from '../services/logs/uploader.js';
import { cleanupTorrentFiles } from '../services/torrent/autoclean.js';

import { createActivationWindow, validateActivationKey } from './activation-window.js';
import { DiscordRPC } from './discord.js';
import { handleProtocolLink } from './protocol.js';
import { TrayManager } from './tray-window.js';

import { setupRemix } from './remix.js';
import { setupShortcuts, unregisterShortcuts } from './shortcuts.js';
import { setupWindow } from './window.js';
import { setupIpcHandlers } from '../ipc/handlers.js';

let webTorrentProcess: UtilityProcess | null = null;
let subtitlesWorker: Worker | null = null;
let mainWindow: BrowserWindow | null = null;
let trayManager: TrayManager | null = null;
let forceQuit = false;
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

    const torrentsToAdd = await cleanupTorrentFiles();
    await setupRemix(build, viteDevServer);

    webTorrentProcess = utilityProcess.fork(
      path.join(__dirname, '../services/torrent/client.js'),
      [],
      {
        env: {
          ...process.env,
          UV_THREADPOOL_SIZE: '4',
          NODE_OPTIONS: '--max-old-space-size=4096'
        }
      }
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

    if (!appIsActivated && !process.env.DEV) {
      mainWindow = await createActivationWindow();
    } else {
      mainWindow = await setupWindow();
    }

    mainWindow.setMaxListeners(100);

    await setupIpcHandlers(webTorrentProcess, subtitlesWorker, mainWindow);
    setupShortcuts(mainWindow);

    trayManager = new TrayManager(mainWindow);

    mainWindow.on('close', (event) => {
      if (!forceQuit) {
        event.preventDefault();
        mainWindow?.hide();
        return false;
      }
    });

    const deepLinkingUrl = process.argv[process.argv.length - 1];
    if (deepLinkingUrl.startsWith('anitorrent://')) {
      handleProtocolLink(deepLinkingUrl);
    }

    configService.mainWindow = mainWindow;
    tempWindow.destroy();

    const discordRPC = new DiscordRPC(mainWindow);

    webTorrentProcess.on('message', (message) => {
      if (message.type === IPC_CHANNELS.TORRENT.ACTIVE_TORRENTS) {
        trayManager?.updateTorrentData(message.data);
      }
    });

    webTorrentProcess.postMessage({
      type: IPC_CHANNELS.TORRENT.GET_ACTIVE_TORRENTS
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    for (const torrent of torrentsToAdd) {
      log.info('Adding autoclean torrent:', torrent);
      webTorrentProcess.postMessage({
        type: IPC_CHANNELS.TORRENT.ADD,
        data: {
          ...torrent,
          fromAutoclean: true
        }
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    app.on('before-quit', async (event) => {
      event.preventDefault();
      log.info('Cleaning up workers...');
      unregisterShortcuts();

      try {
        discordRPC.destroy();
        await uploadLogFile(mainWindow);
        if (subtitlesWorker) await subtitlesWorker.terminate();
        if (webTorrentProcess) webTorrentProcess.kill();
        if (trayManager) {
          trayManager.cleanup();
          trayManager = null;
        }
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
