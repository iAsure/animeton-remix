import { BrowserWindow } from 'electron';
import path from 'path';
import log from 'electron-log';
import { fileURLToPath } from "node:url";

let mainWindow: BrowserWindow | null = null;
const windows = new Set<BrowserWindow>();
const __dirname = path.dirname(fileURLToPath(import.meta.url));


export function getMainWindow() {
  return mainWindow;
}

export function getAllWindows() {
  return Array.from(windows);
}

export async function setupWindow(partition = 'persist:partition'): Promise<BrowserWindow> {
  log.info('Creating main window...');
  
  mainWindow = new BrowserWindow({
    icon: "./public/favicon.png",
    width: 1800,
    minWidth: 1350,
    height: 900,
    minHeight: 750,
    frame: false,
    webPreferences: {
      partition,
      preload: path.join(__dirname, "../../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
  });

  if (process.env.DEV) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  const port = process.env.DEV ? ':5173' : '';
  try {
    await mainWindow.loadURL(`https://remix${port}/`);
  } catch (error) {
    log.error('Failed to load main window:', error);
    throw error;
  }

  mainWindow.webContents.on('did-finish-load', () => {
    log.info('Main window loaded successfully');
  });

  windows.add(mainWindow);
  
  mainWindow.on('closed', () => {
    windows.delete(mainWindow);
    mainWindow = null;
  });

  return mainWindow;
}