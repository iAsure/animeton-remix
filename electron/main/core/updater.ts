import { ipcMain } from 'electron';
import electronUpdater from 'electron-updater';
import log from 'electron-log';

import { IPC_CHANNELS } from '../../shared/constants/event-channels.js';

export const getAutoUpdater = () => {
  const { autoUpdater } = electronUpdater;
  return autoUpdater;
};

export const init = () => {
  log.info('Initializing updater');
  const autoUpdater = getAutoUpdater();

  autoUpdater.on('error', (err) => {
    log.error(`Update error: ${err.message}`);
    ipcMain.emit(IPC_CHANNELS.UPDATER.ERROR, err);
  });

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update');
    ipcMain.emit(IPC_CHANNELS.UPDATER.CHECKING_FOR_UPDATE);
  });

  autoUpdater.on('update-available', () => {
    log.info('Update available');
    ipcMain.emit(IPC_CHANNELS.UPDATER.AVAILABLE);
  });

  autoUpdater.on('update-not-available', () => {
    log.info('No update available');
    ipcMain.emit(IPC_CHANNELS.UPDATER.NOT_AVAILABLE);
  });

  autoUpdater.on('update-downloaded', (e) => {
    log.info('Update downloaded:', e);
    ipcMain.emit(IPC_CHANNELS.UPDATER.DOWNLOADED, e);
  });

  autoUpdater.checkForUpdates();
};
