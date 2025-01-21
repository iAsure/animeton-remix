import { BrowserWindow } from 'electron';
import path from 'path';
import log from 'electron-log';
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let activationWindow: BrowserWindow | null = null;

export async function validateActivationKey(key: string | null): Promise<boolean> {
  if (!key) return false;
  
  try {
    const response = await fetch(`https://api.animeton.com/keys/validate/${key}`);
    const result = await response.json();
    return Boolean(result?.valid);
  } catch (error) {
    log.error('Error validating key:', error);
    return false;
  }
}

export function createActivationWindow(partition = 'persist:partition'): Promise<BrowserWindow> {
  log.info('Creating activation window...');
  
  activationWindow = new BrowserWindow({
    icon: "./public/favicon.png",
    width: 460,
    height: 530,
    frame: false,
    resizable: false,
    webPreferences: {
      partition,
      preload: path.join(__dirname, "../../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
  });

  const port = process.env.DEV ? ':5173' : '';
  
  return activationWindow.loadURL(`https://remix${port}/activation`).then(() => {
    if (process.env.DEV) {
      activationWindow.webContents.openDevTools({ mode: 'detach' });
    }
    return activationWindow;
  });
}

export function closeActivationWindow() {
  if (activationWindow) {
    activationWindow.close();
    activationWindow = null;
  }
} 