import { app, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import { watch, FSWatcher } from 'fs';
import path from 'path';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';

interface WatchProgress {
  timeStamp: number;
  duration: number;
  progress: number;
  completed: boolean;
  lastWatched: number;
}

interface EpisodeHistory {
  animeName: string;
  animeImage: string;
  animeIdAnilist: number;
  episodeImage: string;
  episodeNumber: number;
  episodeTorrentUrl: string;
  pubDate: string;
  progressData: WatchProgress;
}

interface WatchHistory {
  lastUpdated: number;
  episodes: {
    [id: string]: EpisodeHistory;
  };
}

export class HistoryService {
  private historyPath: string;
  private history: WatchHistory;
  private watcher: FSWatcher | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.historyPath = path.join(app.getPath('userData'), 'history.json');
    this.history = this.getDefaultHistory();
    this.mainWindow = mainWindow;
  }

  private getDefaultHistory(): WatchHistory {
    return {
      lastUpdated: Date.now(),
      episodes: {},
    };
  }

  async initialize() {
    try {
      await this.loadHistory();
      this.setupFileWatcher();
    } catch (error) {
      log.error('Failed to load history, using defaults:', error);
      await this.saveHistory();
    }
  }

  private setupFileWatcher() {
    if (this.watcher) this.watcher.close();

    this.watcher = watch(
      path.dirname(this.historyPath),
      { persistent: true },
      async (eventType, filename) => {
        if (
          filename === path.basename(this.historyPath) &&
          eventType === 'change'
        ) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 100));
            const previousHistory = { ...this.history };
            await this.loadHistory();

            if (
              JSON.stringify(previousHistory) !== JSON.stringify(this.history)
            ) {
              this.mainWindow?.webContents.send(
                'history:changed',
                this.history
              );
              log.info('History file changed externally');
            }
          } catch (error) {
            log.error('Error reloading history after file change:', error);
          }
        }
      }
    );
  }

  private async loadHistory() {
    try {
      const data = await fs.readFile(this.historyPath, 'utf-8');
      this.history = JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.history = this.getDefaultHistory();
        await this.saveHistory();
      } else {
        throw error;
      }
    }
  }

  private async saveHistory() {
    this.history.lastUpdated = Date.now();
    await fs.writeFile(this.historyPath, JSON.stringify(this.history, null, 2));
  }

  async updateEpisodeProgress(
    episodeId: string,
    progress: number,
    duration: number,
    episodeInfo: Omit<EpisodeHistory, 'progressData'>
  ) {
    const progressData = {
      timeStamp: Date.now(),
      duration,
      progress,
      completed: progress >= 0.9,
      lastWatched: Date.now(),
    };

    this.history.episodes[episodeId] = {
      ...episodeInfo,
      progressData,
    };

    await this.saveHistory();

    this.mainWindow?.webContents.send(IPC_CHANNELS.HISTORY.EPISODE_UPDATED, {
      episodeId,
      episode: this.history.episodes[episodeId],
    });
  }

  async getEpisodeProgress(episodeId: string) {
    return this.history.episodes[episodeId];
  }

  async getAllHistory() {
    return this.history;
  }

  async clearHistory() {
    this.history = this.getDefaultHistory();
    await this.saveHistory();
    this.mainWindow?.webContents.send('history:changed', this.history);
  }

  cleanup() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
