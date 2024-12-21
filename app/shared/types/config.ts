export interface UserConfig {
  discordId?: string | null;
  activationKey?: string | null;
}

export interface AppConfig {
  user: UserConfig;
  features: {
    downloadIndicator: boolean;
    subtitlesIndicator: boolean;
    subtitlesStatus: boolean;
    [key: string]: boolean;
  };
  preferences: {
    theme?: 'dark' | 'light';
    language?: string;
    [key: string]: any;
  };
  [key: string]: any;
}
