import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';
import log from 'electron-log';

export function setupSubtitlesHandlers(subtitlesWorker, mainWindow) {
  const extractSubtitles = async (filePath) => {
    log.info('Extracting subtitles from:', filePath);
    
    try {
      const result = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Subtitle extraction timed out'));
        }, 60000);

        const handleMessage = (result) => {
          clearTimeout(timeoutId);
          
          if (result.type === 'error') {
            reject(new Error(result.error));
          } else if (result.type === 'complete') {
            resolve(result.data);
          }
        };

        subtitlesWorker.once('message', handleMessage);
        subtitlesWorker.postMessage({ filePath });
      });

      mainWindow?.webContents.send(IPC_CHANNELS.SUBTITLES.EXTRACTED, {
        success: true,
        data: result
      });
      
      return { success: true, data: result };
    } catch (error) {
      log.error('Error extracting subtitles:', error);
      mainWindow?.webContents.send(IPC_CHANNELS.SUBTITLES.ERROR, {
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  };

  return {
    extractSubtitles
  };
}