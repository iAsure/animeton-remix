import { globalShortcut, BrowserWindow } from 'electron';
import log from 'electron-log';

export function setupShortcuts(mainWindow: BrowserWindow) {
  try {
    globalShortcut.register('F11', () => {
      if (mainWindow.isFocused()) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    });

    mainWindow.on('focus', () => {
      mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'Escape' && mainWindow.isFullScreen()) {
          mainWindow.setFullScreen(false);
          event.preventDefault();
        }
      });
    });

    if (!process.env.DEV) {
      globalShortcut.register('Control+Shift+I', () => {
        return false;
      });
    }

    log.info('Shortcuts registered successfully');
  } catch (error) {
    log.error('Failed to register shortcuts:', error);
  }
}

export function unregisterShortcuts() {
  globalShortcut.unregisterAll();
  log.info('Global shortcuts unregistered');
}