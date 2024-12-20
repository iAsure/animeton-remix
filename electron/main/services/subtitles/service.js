import log from 'electron-log';
import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';

export class SubtitlesService {
  constructor(subtitlesWorker, mainWindow) {
    this.worker = subtitlesWorker;
    this.mainWindow = mainWindow;
  }

  async processFile(filePath) {
    log.info('Processing subs on file:', filePath);
    
    try {
      const result = await this.extractSubtitles(filePath);
      log.info('Extraction completed with result:', result);
      return result;
    } catch (error) {
      log.error('Error processing subtitles:', error);
      this.mainWindow?.webContents.send(IPC_CHANNELS.SUBTITLES.ERROR, {
        error: error.message || 'Unknown error during subtitle extraction'
      });
      throw error;
    }
  }

  async extractSubtitles(filePath) {
    log.info('Extracting subtitles from:', filePath);
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Subtitle extraction timed out'));
      }, 60000);

      const handleMessage = (result) => {
        clearTimeout(timeoutId);
        this.worker.removeListener('message', handleMessage);
        
        if (result.type === 'error') {
          this.mainWindow?.webContents.send(IPC_CHANNELS.SUBTITLES.ERROR, {
            success: false,
            error: result.error
          });
          resolve({ success: false, error: result.error });
        } else if (result.type === 'complete') {
          this.mainWindow?.webContents.send(IPC_CHANNELS.SUBTITLES.EXTRACTED, {
            success: true,
            data: result.data
          });
          resolve({ success: true, data: result.data });
        }
      };

      this.worker.on('message', handleMessage);
      this.worker.postMessage({ filePath });
    });
  }
} 