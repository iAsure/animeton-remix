import log from 'electron-log';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { BrowserWindow } from 'electron';
import { ConfigService } from '../config/service.js';
import { AppConfig } from '../../../shared/types/config.js';
import { API_URL } from '../../../shared/constants/config.js';

export async function uploadLogFile(window: BrowserWindow) {
  try {
    log.info('LogUploader: Starting log upload');
    const configService = new ConfigService(window);
    await configService.initialize();
    const config = await configService.get<AppConfig>();
    const userId = config?.user?.discordId;

    if (!userId) {
      log.warn('LogUploader: No user ID found, skipping log upload');
      return;
    }

    const logFile = log.transports.file.getFile();
    if (!logFile) {
      log.warn('LogUploader: No log file found');
      return;
    }

    const logPath = logFile.path;
    const logContent = await fs.readFile(logPath);

    const formData = new FormData();
    formData.append('file', logContent, {
      filename: path.basename(logPath),
      contentType: 'text/plain',
    });

    const response = await fetch(
      `${API_URL}/logs/${userId}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    log.info('Log file uploaded successfully');
  } catch (error) {
    log.error('Failed to upload log file:', error);
  }
}
