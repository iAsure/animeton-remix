import { BrowserWindow } from 'electron';
import path from 'path';
import log from 'electron-log';
import fetch from 'node-fetch';
import { fileURLToPath } from 'node:url';
import { ActivationResult } from '../../shared/types/api.js';
import { API_URL } from '../../shared/constants/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let activationWindow: BrowserWindow | null = null;

export async function validateActivationKey(
  key: string | null
): Promise<boolean> {
  if (!key) return false;

  try {
    const response = await fetch(
      `${API_URL}/keys/validate/${key}`
    );
    const result = await response.json() as { valid: boolean };
    return Boolean(result?.valid);

  } catch (error) {
    log.error('Error validating key:', error);
    return false;
  }
}

export async function activateKey(key: string): Promise<ActivationResult> {
  try {
    const response = await fetch(`${API_URL}/keys/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });


    const result = await response.json() as { success: boolean, message: string };

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
    minHeight: 510,
    height: 510,
    maxHeight: 510,
    frame: false,
    resizable: false,
    webPreferences: {
      partition,
      preload: path.join(__dirname, '../../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: process.env.DEV === '1',
    },
  });

  const port = process.env.DEV ? ':5173' : '';

  if (!process.env.DEV) {
    activationWindow.webContents.on('devtools-opened', () => {
      activationWindow.webContents.closeDevTools();
    });
  }

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
