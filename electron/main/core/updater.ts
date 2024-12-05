import electronUpdater from 'electron-updater';
import log from 'electron-log';

export const getAutoUpdater = () => {
  const { autoUpdater } = electronUpdater;
  return autoUpdater;
};

export const init = () => {
  log.info('Initializing updater');
  const autoUpdater = getAutoUpdater();

  autoUpdater.on('error', (err) => log.error(`Update error: ${err.message}`));

  autoUpdater.on('checking-for-update', () => log.info('Checking for update'));

  autoUpdater.on('update-available', () => {
    log.info('Update available');
  });

  autoUpdater.on('update-not-available', () => log.info('No update available'));

  autoUpdater.on('update-downloaded', (e) => {
    log.info('Update downloaded:', e);
  });

  autoUpdater.checkForUpdates();
};
