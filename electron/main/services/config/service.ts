// electron/main/services/config/service.ts
import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import log from 'electron-log';
import type { AppConfig } from '../../../shared/types/config.js';

export class ConfigService {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'config.json');
    this.config = this.getDefaultConfig();
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
    } catch (error) {
      log.error('Failed to load config, using defaults:', error);
      await this.saveConfig();
    }
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
}