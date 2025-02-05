import { app, protocol } from 'electron';
import log from 'electron-log';
import { initializeApp } from './core/app.js';

const sessionTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
log.initialize();

log.transports.file.resolvePathFn = () => {
  const userDataPath = app.getPath('userData');
  return `${userDataPath}/logs/anitorrent-${sessionTimestamp}.log`;
};

log.transports.file.getFile().clear();
const errorLog = log.create({ logId: 'error-only' });

errorLog.transports.file.resolvePathFn = () => {
  const userDataPath = app.getPath('userData');
  return `${userDataPath}/logs/anitorrent-${sessionTimestamp}-errors.log`;
};
errorLog.transports.file.level = 'error';

// Register privileged schemes before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: "http",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

app.whenReady().then(initializeApp).catch((error) => {
  console.error('Failed to initialize app:', error);
  app.quit();
});
