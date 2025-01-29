import electronUpdater from 'electron-updater';
import log from 'electron-log';
import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '../../shared/constants/event-channels.js';

export const getAutoUpdater = () => {
  const { autoUpdater } = electronUpdater;
  return autoUpdater;
};

export const init = (mainWindow: Electron.BrowserWindow) => {
  log.info('Initializing updater');
  const autoUpdater = getAutoUpdater();

  autoUpdater.on('error', (err) => {
    log.error(`Update error: ${err.message}`);
    mainWindow.webContents.send(IPC_CHANNELS.UPDATER.ERROR, err);
  });

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update');
    mainWindow.webContents.send(IPC_CHANNELS.UPDATER.CHECKING_FOR_UPDATE);
  });

  autoUpdater.on('update-available', () => {
    log.info('Update available');
    mainWindow.webContents.send(IPC_CHANNELS.UPDATER.AVAILABLE);
  });

  autoUpdater.on('update-not-available', () => {
    log.info('No update available');
    mainWindow.webContents.send(IPC_CHANNELS.UPDATER.NOT_AVAILABLE);
  });

  autoUpdater.on('update-downloaded', (e) => {
    log.info('Update downloaded:', e);
    mainWindow.webContents.send(IPC_CHANNELS.UPDATER.DOWNLOADED, e);
  });

  ipcMain.handle(IPC_CHANNELS.UPDATER.QUIT_AND_INSTALL, () => {
    log.info('Quitting and installing update');
    autoUpdater.quitAndInstall(true, true);
  });

  autoUpdater.checkForUpdates();
};
