import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import log from 'electron-log';

import { app, BrowserWindow, session, protocol, ipcMain, utilityProcess, net } from "electron";
import { createRequestHandler } from "@remix-run/node";
import * as mime from "mime-types";

const appId = 'com.tiahui.animeton';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

protocol.registerSchemesAsPrivileged([
  {
    scheme: "http",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

log.initialize();
log.info('Application Starting...');

const viteDevServer = !process.env.DEV
  ? undefined
  : await import("vite").then((vite) => {
      log.info('Initializing Vite dev server...');
      return vite.createServer({
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
    });

const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
  : () => import("./build/server/index.js");

let port = "";
if (viteDevServer) {
  await viteDevServer.listen(5173);
  const address = viteDevServer.httpServer?.address();
  if (address && typeof address !== "string") {
    port = ":" + address.port;
  } else if (address) {
    const url = new URL(address);
    port = ":" + url.port;
  } else {
    throw new Error("Failed to get dev server port");
  }
}

let webTorrentPort = null;

app.whenReady().then(async () => {
  try {
    log.info(`Starting app with build ID: ${appId}`);
    app.setAppUserModelId(appId);
    const remixHandler = createRequestHandler(build);
    const partition = "persist:partition";
    const ses = session.fromPartition(partition);
    let win;

    // Initialize WebTorrent process
    log.info('Forking WebTorrent process...');
    const webTorrentProcess = utilityProcess.fork('electron/webtorrent.js');

    // Handle WebTorrent messages
    webTorrentProcess.on('message', (message) => {
      log.debug('WebTorrent message received:', message.type);
      if (message.type === 'server-ready') {
        webTorrentPort = message.port;
        log.info(`WebTorrent server ready on port ${message.port}`);
        setupCSP(webTorrentPort, ses);
      }
      
      if (['torrent-progress', 'torrent-done', 'torrent-server-done', 'torrent-file'].includes(message.type)) {
        win?.webContents.send(message.type, message.data);
      }
    });

    // Setup IPC handlers
    ipcMain.on('webtorrent-action', (event, arg) => {
      webTorrentProcess.postMessage(arg);
    });

    async function createWindow() {
      log.info('Creating main window...');
      win = new BrowserWindow({
        icon: "./public/favicon.png",
        width: 900,
        height: 900,
        webPreferences: {
          partition,
          preload: path.join(__dirname, "preload/preload.cjs"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        },
      });

      if (!!process.env.DEV) {
        win.webContents.openDevTools({ mode: 'detach' });
      }

      win.loadURL(`https://remix${port}/`);

      win.webContents.on('did-finish-load', () => {
        log.info('Main window loaded successfully');
      });

      win.on('closed', () => {
        log.info('Main window closed');
      });
    }

    ses.protocol.handle("https", async (request) => {
      const url = new URL(request.url);
      log.debug(`Handling HTTPS request: ${url.pathname}`);

      if (
        url.pathname !== "/" &&
        (request.method === "GET" || request.method === "HEAD")
      ) {
        if (viteDevServer) {
          const staticFile = path.resolve(__dirname, "../public" + url.pathname);
          if (
            await fsp
              .stat(staticFile)
              .then((s) => s.isFile())
              .catch(() => false)
          ) {
            return new Response(await fsp.readFile(staticFile), {
              headers: {
                "content-type": mime.lookup(path.basename(staticFile)) || "text/plain",
              },
            });
          }

          if (request.method === "HEAD") {
            return new Response(null, {
              headers: {
                "access-control-allow-origin": "*",
                "access-control-allow-methods": "GET, HEAD",
              },
            });
          }
          try {
            const VALID_ID_PREFIX = `/@id/`;
            const NULL_BYTE_PLACEHOLDER = `__x00__`;
            let id = url.pathname + url.search;
            id = id.startsWith(VALID_ID_PREFIX)
              ? id
                  .slice(VALID_ID_PREFIX.length)
                  .replace(NULL_BYTE_PLACEHOLDER, "\0")
              : id;

            const transformed = await viteDevServer.transformRequest(id, {
              html: false,
              ssr: false,
            });
            if (transformed) {
              return new Response(transformed.code, {
                headers: {
                  "content-type": "application/javascript",
                },
              });
            }
          } catch (error) {}
        } else {
          const file = path.resolve(
            __dirname,
            "build",
            "client",
            url.pathname.slice(1)
          );
          try {
            const isFile = await fsp.stat(file).then((s) => s.isFile());
            if (isFile) {
              return new Response(await fsp.readFile(file), {
                headers: {
                  "content-type": mime.lookup(path.basename(file)) || "text/plain",
                },
              });
            }
          } catch {}
        }
      }

      try {
        return await remixHandler(request);
      } catch (error) {
        log.error('Request handler error:', error);
        return new Response("Internal Server Error", { status: 500 });
      }
    });

    protocol.handle('file', (request) => {
      let filePath = request.url.slice(7) // remove 'file://'
      
      // Handle vendor files specially
      if (filePath.startsWith('/vendor/')) {
        filePath = path.join(__dirname, '../public', filePath)
      }
      
      return net.fetch(`file://${filePath}`)
    })

    await createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    process.on('uncaughtException', (error) => {
      log.error('Uncaught exception:', error);
    });

    process.on('unhandledRejection', (reason) => {
      log.error('Unhandled rejection:', reason);
    });
  } catch (error) {
    log.error('Failed to initialize application:', error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  log.info('All windows closed');
  if (process.platform !== "darwin") {
    log.info('Quitting application');
    app.quit();
  }
});

function setupCSP(port, ses) {
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self'; ` +
          `script-src 'self'; ` +
          `media-src 'self' http://localhost:${port} blob:; ` +
          `connect-src 'self' http://localhost:${port}; ` +
          `img-src 'self' data: http: https:; ` +
          `style-src 'self' 'unsafe-inline';`
        ]
      }
    });
  });
}
