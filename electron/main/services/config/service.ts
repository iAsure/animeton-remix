// electron/main/services/config/service.ts
import { app, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import { watch, FSWatcher } from 'fs';
import path from 'path';
import log from 'electron-log';
import { AppConfig } from '../../../shared/types/config.js';
import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';

export class ConfigService {
  private configPath: string;
  private config: AppConfig;
  private watcher: FSWatcher | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.configPath = path.join(app.getPath('userData'), 'config.json');
    this.config = this.getDefaultConfig();
    this.mainWindow = mainWindow;
  }

  private getDefaultConfig(): AppConfig {
    return {
      user: {},
      features: {},
      preferences: {
        theme: 'dark',
        language: 'es-la'
      }
    };
  }

  async initialize() {
    try {
      await this.loadConfig();
      this.setupFileWatcher();
    } catch (error) {
      log.error('Failed to load config, using defaults:', error);
      await this.saveConfig();
    }
  }

  private setupFileWatcher() {
    if (this.watcher) {
      this.watcher.close();
    }

    // Watch for file changes
    this.watcher = watch(
      path.dirname(this.configPath),
      { persistent: true },
      async (eventType, filename) => {
        if (
          filename === path.basename(this.configPath) &&
          eventType === 'change'
        ) {
          try {
            // Add a small delay to ensure file is completely written
            await new Promise(resolve => setTimeout(resolve, 100));
            const previousConfig = { ...this.config };
            await this.loadConfig();
            
            // Only notify if there are actual changes
            if (JSON.stringify(previousConfig) !== JSON.stringify(this.config)) {
              this.mainWindow?.webContents.send(
                IPC_CHANNELS.CONFIG.CHANGED,
                this.config
              );
              log.info('Config file changed externally');
            }
          } catch (error) {
            log.error('Error reloading config after file change:', error);
          }
        }
      }
    );
  }

  private async loadConfig() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.config = { ...this.getDefaultConfig(), ...JSON.parse(data) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.config = this.getDefaultConfig();
        await this.saveConfig();
      } else {
        throw error;
      }
    }
  }

  private async saveConfig() {
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
  }

  async get<T>(key?: string): Promise<T> {
    if (!key) return this.config as T;
    return key.split('.').reduce((obj, k) => obj?.[k], this.config) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, k) => {
      if (!(k in obj)) obj[k] = {};
      return obj[k];
    }, this.config);
    
    target[lastKey] = value;
    await this.saveConfig();
  }

  async update(partialConfig: Partial<AppConfig>): Promise<void> {
    this.config = { ...this.config, ...partialConfig };
    await this.saveConfig();
  }

  cleanup() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}