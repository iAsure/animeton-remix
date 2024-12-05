import { BrowserWindow } from 'electron';
import path from 'path';
import log from 'electron-log';
import { fileURLToPath } from "node:url";

let mainWindow = null;
const windows = new Set();
const __dirname = path.dirname(fileURLToPath(import.meta.url));


export function getMainWindow() {
  return mainWindow;
}

export function getAllWindows() {
  return Array.from(windows);
}

export async function setupWindow(partition = 'persist:partition') {
  log.info('Creating main window...');
  
  mainWindow = new BrowserWindow({
    icon: "./public/favicon.png",
    width: 900,
    height: 900,
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
  await mainWindow.loadURL(`https://remix${port}/`);

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