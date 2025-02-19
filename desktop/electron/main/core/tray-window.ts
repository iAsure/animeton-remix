import { BrowserWindow, Tray, nativeImage, screen, ipcMain, app } from 'electron';
import log from 'electron-log';
import fs from 'fs';
import path from 'path';

interface TorrentProgress {
  numPeers: number;
  downloaded: number;
  total: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  remaining: string;
  isBuffering: boolean;
  ready: boolean;
}

interface ActiveTorrent {
  infoHash: string;
  name: string;
  created: number;
  progress: TorrentProgress;
}

interface HistoryData {
  lastUpdated: number;
  episodes: {
    [key: string]: {
      animeName: string;
      episodeNumber: number;
    };
  };
}

export class TrayManager {
  private tray: Tray | null = null;
  private trayWindow: BrowserWindow | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private activeTorrents: ActiveTorrent[] = [];
  private mainWindow: BrowserWindow;
  private trayActionHandler: (event: Electron.IpcMainEvent, action: string) => void;
  private hideWindowHandler: () => void;
  private historyData: HistoryData | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.loadHistoryData();
    
    this.trayActionHandler = (_, action) => {
      switch (action) {
        case 'open':
          this.mainWindow.show();
          this.mainWindow.focus();
          this.trayWindow?.hide();
          break;
        case 'quit':
          app.quit();
          break;
      }
    };

    this.hideWindowHandler = () => {
      this.trayWindow?.hide();
    };

    this.setupTray();
  }

  private loadHistoryData() {
    try {
      const historyPath = path.join(app.getPath('appData'), 'anitorrent', 'history.json');
      const historyContent = fs.readFileSync(historyPath, 'utf-8');
      this.historyData = JSON.parse(historyContent);
    } catch (error) {
      log.error('Error loading history data:', error);
      this.historyData = null;
    }
  }

  private setupTray() {
    log.info('Creating tray icon');
    const trayIcon = nativeImage.createFromPath('./public/favicon.ico');
    this.tray = new Tray(trayIcon);
    this.tray.setToolTip('AniTorrent');

    this.createTrayWindow();
    this.setupEventListeners();
    this.startUpdateInterval();
  }

  private createTrayWindow() {
    this.trayWindow = new BrowserWindow({
      width: 300,
      height: 150,
      show: false,
      frame: false,
      fullscreenable: false,
      resizable: false,
      transparent: true,
      skipTaskbar: true,
      alwaysOnTop: true,
      type: 'toolbar',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    const content = `
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 4px;
            background: #0D0D0D;
            color: white;
            font-family: system-ui;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            overflow: hidden;
            user-select: none;
            -webkit-user-select: none;
            height: 100vh;
          }
          #content {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .menu-item {
            padding: 6px 8px;
            cursor: pointer;
            border-radius: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 0.9em;
            transition: background 0.15s ease;
          }
          .menu-item:not(.disabled):hover {
            background: rgba(255, 255, 255, 0.05);
          }
          .menu-item:not(.disabled):active {
            background: rgba(255, 255, 255, 0.08);
          }
          .menu-item.disabled {
            cursor: default;
            padding: 8px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 6px;
            margin: 0 -4px;
          }
          .separator {
            height: 1px;
            background: rgba(255, 255, 255, 0.06);
            margin: 2px 0;
          }
          .status-title {
            font-size: 0.75em;
            color: #666;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }
          .status-left {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .status-right {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #888;
          }
          .torrent-count {
            color: #fff;
            font-weight: 500;
          }
          .progress {
            color: #4ade80;
          }
          .speed {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 0.85em;
          }
          .download-speed {
            color: #4ade80;
          }
          .upload-speed {
            color: #f87171;
          }
          ::-webkit-scrollbar {
            display: none;
          }
        </style>
      </head>
      <body>
        <div id="content"></div>
        <script>
          const { ipcRenderer } = require('electron');
          
          ipcRenderer.on('update-content', (_, data) => {
            const content = document.getElementById('content');
            content.innerHTML = data;
            
            // Ajustar altura de la ventana basada en el contenido real
            const height = content.getBoundingClientRect().height + 8;
            ipcRenderer.send('resize-tray-window', height);
          });

          function sendAction(action) {
            ipcRenderer.send('tray-action', action);
          }

          // Delegación de eventos para los clicks
          document.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem && !menuItem.classList.contains('disabled')) {
              const action = menuItem.getAttribute('data-action');
              if (action) sendAction(action);
            }
          });
        </script>
      </body>
      </html>
    `;

    this.trayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);
  }

  private setupEventListeners() {
    if (!this.tray || !this.trayWindow) return;

    ipcMain.removeListener('tray-action', this.trayActionHandler);
    ipcMain.removeListener('hide-tray-window', this.hideWindowHandler);

    ipcMain.on('tray-action', this.trayActionHandler);
    ipcMain.on('hide-tray-window', this.hideWindowHandler);
    ipcMain.on('resize-tray-window', (_, height) => {
      if (this.trayWindow && this.trayWindow.isVisible()) {
        const finalHeight = Math.min(400, Math.max(150, height));
        this.trayWindow.setSize(300, finalHeight);
        this.showTrayWindow();
      }
    });

    this.tray.on('right-click', () => this.showTrayWindow());
    this.tray.on('click', () => {
      this.mainWindow.show();
      this.mainWindow.focus();
    });

    this.trayWindow.on('blur', () => {
      this.trayWindow?.hide();
    });
  }

  private startUpdateInterval() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.updateInterval = setInterval(() => this.updateTrayContent(), 1000);
  }

  private showTrayWindow() {
    if (!this.tray || !this.trayWindow) return;

    const trayBounds = this.tray.getBounds();
    const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
    const workArea = display.workArea;

    this.trayWindow.setSize(300, 50);
    const windowBounds = this.trayWindow.getBounds();

    let x = Math.floor(trayBounds.x - (windowBounds.width / 2) + (trayBounds.width / 2));
    let y = Math.floor(trayBounds.y - windowBounds.height);

    if (x + windowBounds.width > workArea.x + workArea.width) {
      x = workArea.x + workArea.width - windowBounds.width;
    }
    if (x < workArea.x) {
      x = workArea.x;
    }

    if (y < workArea.y) {
      y = trayBounds.y + trayBounds.height;
    }

    this.trayWindow.setAlwaysOnTop(true, 'pop-up-menu');
    this.trayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    this.trayWindow.setPosition(x, y);
    this.trayWindow.show();
    this.updateTrayContent();

    this.trayWindow.focus();
  }

  private updateTrayContent() {
    if (!this.trayWindow) return;

    const formatSpeed = (speed: number) => {
      const mbps = speed / 1024 / 1024;
      return mbps >= 1 ? `${mbps.toFixed(1)}MB/s` : `${(speed / 1024).toFixed(1)}KB/s`;
    };

    const totalTorrents = this.activeTorrents.length;
    const totalProgress = totalTorrents > 0 
      ? Math.round(this.activeTorrents.reduce((acc, t) => acc + t.progress.progress, 0) / totalTorrents * 100)
      : 0;
    const totalDownSpeed = this.activeTorrents.reduce((acc, t) => acc + t.progress.downloadSpeed, 0);
    const totalUpSpeed = this.activeTorrents.reduce((acc, t) => acc + t.progress.uploadSpeed, 0);

    let statusText = '';
    if (totalTorrents > 0) {
      statusText = `
        <div class="menu-item disabled">
          <div class="status-title">Descargas Activas</div>
          <div class="status-content">
            <div class="status-left">
              <span class="torrent-count">${totalTorrents}</span>
              <span style="color: #666">·</span>
              <span class="progress">${totalProgress}%</span>
            </div>
            <div class="status-right">
              <span class="speed">
                <span class="download-speed">↓${formatSpeed(totalDownSpeed)}</span>
                <span class="upload-speed">↑${formatSpeed(totalUpSpeed)}</span>
              </span>
            </div>
          </div>
        </div>
      `;
    }

    const content = `
      <div class="menu-item" data-action="open">Abrir AniTorrent</div>
      ${totalTorrents > 0 ? '<div class="separator"></div>' + statusText : ''}
      <div class="separator"></div>
      <div class="menu-item" data-action="quit">Salir</div>
    `;

    this.trayWindow.webContents.send('update-content', content);
  }

  public updateTorrentData(data: ActiveTorrent[]) {
    const hasChanges = JSON.stringify(this.activeTorrents) !== JSON.stringify(data);
    
    if (hasChanges) {
      this.activeTorrents = data;
      this.updateTrayContent();
    }
  }

  public cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    ipcMain.removeListener('tray-action', this.trayActionHandler);
    ipcMain.removeListener('hide-tray-window', this.hideWindowHandler);

    if (this.trayWindow) {
      this.trayWindow.destroy();
      this.trayWindow = null;
    }

    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
} 