import { globalShortcut, BrowserWindow } from 'electron';
import log from 'electron-log';

export function setupShortcuts(mainWindow: BrowserWindow) {
  try {
    globalShortcut.register('F11', () => {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });

    globalShortcut.register('Escape', () => {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      }
    });

    if (!process.env.DEV) {
      globalShortcut.register('Control+Shift+I', () => {
        return false;
      });
    }

    log.info('Global shortcuts registered successfully');
  } catch (error) {
    log.error('Failed to register shortcuts:', error);
  }
}

export function unregisterShortcuts() {
  globalShortcut.unregisterAll();
  log.info('Global shortcuts unregistered');
}