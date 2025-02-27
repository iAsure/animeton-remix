import { Client } from 'discord-rpc';
import { ipcMain, BrowserWindow } from 'electron';
import { debounce } from '../../shared/utils/debounce.js';
import log from 'electron-log';

interface DiscordActivity {
  timestamps?: { start: number };
  details?: string;
  state?: string;
  assets?: {
    small_image?: string;
    small_text?: string;
    large_image?: string;
    large_text?: string;
  };
  buttons?: Array<{
    label: string;
    url: string;
  }>;
  instance?: boolean;
  type?: number;
  pid?: number;
}

interface DiscordStatus {
  activity: DiscordActivity;
}

export class DiscordRPC {
  private readonly client: Client;
  private readonly defaultStatus: DiscordStatus;
  private allowDetails: boolean = true;
  private cachedPresence?: DiscordStatus;
  private readonly debouncedUpdate: (status?: DiscordStatus) => void;

  constructor(private readonly window: BrowserWindow) {
    this.client = new Client({ transport: 'ipc' });
    this.defaultStatus = {
      activity: {
        instance: true,
        type: 3,
        timestamps: {
          start: Date.now()
        },
        buttons: [
          {
            label: 'Descarga la App',
            url: 'https://www.anitorrent.com/'
          }
        ],
        assets: {
          large_image: 'animeton',
        },
      }
    };

    this.window.webContents.setMaxListeners(100);

    this.setupEventListeners();
    this.debouncedUpdate = debounce(this.setActivity.bind(this), 3000);
    this.initialize();
  }

  private setupEventListeners(): void {
    ipcMain.on('show-discord-status', (_, data: boolean) => {
      this.allowDetails = data;
      this.debouncedUpdate(this.allowDetails ? this.cachedPresence : this.defaultStatus);
    });

    ipcMain.on('discord', (_, data: DiscordStatus) => {
      this.cachedPresence = data;
      this.setActivity(this.allowDetails ? this.cachedPresence : this.defaultStatus);
    });

    this.client.on('ready', () => {
      log.info('Discord RPC ready');
      this.setActivity(this.cachedPresence || this.defaultStatus);
      this.subscribeToEvents();
    });

    this.client.on('ACTIVITY_JOIN', ({ secret }) => {
      this.window.webContents.send('w2glink', secret);
    });
  }

  private initialize(): void {
    this.connect();
  }

  private connect(): void {
    this.client.login({ clientId: '1297080240736309348' })
      .catch(() => {
        setTimeout(() => this.connect(), 5000);
      });
  }

  private subscribeToEvents(): void {
    ['ACTIVITY_JOIN_REQUEST', 'ACTIVITY_JOIN', 'ACTIVITY_SPECTATE']
      .forEach(event => this.client.subscribe(event));
  }

  private setActivity(data: DiscordStatus = this.defaultStatus): void {
    if (!this.client.user || !data) return;
    
    this.client.request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {
        ...data.activity,
        timestamps: {
          ...data.activity.timestamps,
          start: data.activity.timestamps?.start || Date.now()
        }
      }
    }).catch(error => {
      log.error('Failed to set Discord activity:', error);
    });
  }

  public destroy(): void {
    this.client.destroy();
  }
}
