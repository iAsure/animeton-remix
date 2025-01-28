import { BrowserWindow } from 'electron';
import path from 'path';
import log from 'electron-log';
import { fileURLToPath } from 'node:url';
import { ActivationResult } from '../../shared/types/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let activationWindow: BrowserWindow | null = null;

export async function validateActivationKey(
  key: string | null
): Promise<boolean> {
  if (!key) return false;

  try {
    const response = await fetch(
      `https://api.animeton.com/keys/validate/${key}`
    );
    const result = await response.json();
    return Boolean(result?.valid);
  } catch (error) {
    log.error('Error validating key:', error);
    return false;
  }
}

export async function activateKey(key: string): Promise<ActivationResult> {
  try {
    const response = await fetch('https://api.animeton.com/keys/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Error activating key');
    }

    return { success: true, ...result };
  } catch (error) {
    log.error('Error activating key:', error);
    return {
      success: false,
      message: error.message || 'Error al activar la clave',
    };
  }
}

export function createActivationWindow(
  partition = 'persist:partition'
): Promise<BrowserWindow> {
  log.info('Creating activation window...');

  if (activationWindow) {
    activationWindow.close();
    activationWindow = null;
  }

  activationWindow = new BrowserWindow({
    icon: './public/favicon.png',
    minWidth: 460,
    width: 460,
    maxWidth: 460,
    minHeight: 530,
    height: 530,
    maxHeight: 530,
    frame: false,
    resizable: false,
    webPreferences: {
      partition,
      preload: path.join(__dirname, '../../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const port = process.env.DEV ? ':5173' : '';

  return activationWindow
    .loadURL(`https://remix${port}/activation`)
    .then(() => {
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
