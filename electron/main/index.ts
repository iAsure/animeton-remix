import { app, protocol } from 'electron';
import log from 'electron-log';
import { initializeApp } from './core/app.js';
import 'dotenv/config';

log.initialize();

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