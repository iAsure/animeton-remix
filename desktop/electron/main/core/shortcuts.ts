import { globalShortcut, BrowserWindow } from 'electron';
import log from 'electron-log';

let beforeInputEventHandler: ((event: Electron.Event, input: Electron.Input) => void) | null = null;

export function setupShortcuts(mainWindow: BrowserWindow) {
  try {
    globalShortcut.register('F11', () => {
      if (mainWindow.isFocused()) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    });

    beforeInputEventHandler = (event, input) => {
      if (input.key === 'Escape' && mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
        event.preventDefault();
      }
    };

    mainWindow.webContents.setMaxListeners(100);

    mainWindow.on('focus', () => {
      mainWindow.webContents.removeAllListeners('before-input-event');
      mainWindow.webContents.on('before-input-event', beforeInputEventHandler);
    });

    mainWindow.on('blur', () => {
      mainWindow.webContents.removeAllListeners('before-input-event');
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
  try {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        // Clean up the before-input-event handler
        if (win.webContents) {
          win.webContents.removeAllListeners('before-input-event');
        }
        
        win.removeAllListeners('focus');
        win.removeAllListeners('blur');
      }
    }
    beforeInputEventHandler = null;
    
    globalShortcut.unregisterAll();
    log.info('Shortcuts and event listeners unregistered successfully');
  } catch (error) {
    log.error('Error unregistering shortcuts and event listeners:', error);
  }
}