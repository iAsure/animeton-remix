import log from 'electron-log';
import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';

export class SubtitlesService {
  constructor(subtitlesWorker, mainWindow) {
    this.worker = subtitlesWorker;
    this.mainWindow = mainWindow;
    this.lastExtraction = 0;
    this.MIN_EXTRACTION_INTERVAL = 2000;
  }

  async processFile(filePath) {
    
    const now = Date.now();
    if (now - this.lastExtraction < this.MIN_EXTRACTION_INTERVAL) {
      return null;
    }
    this.lastExtraction = now;

    try {
      const result = await this.extractSubtitles(filePath);
      if (!result.success) {
        log.warn('Subtitle extraction failed:', result.error);
      }
      return result;
    } catch (error) {
      log.error('Error processing subtitles:', error);
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