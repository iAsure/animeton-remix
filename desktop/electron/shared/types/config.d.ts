export interface UserConfig {
    discordId?: string;
    activationKey?: string;
    createdAt?: string;
    activatedAt?: string;
  }
  
  export interface AppConfig {
    user: UserConfig;
    features: {
      [key: string]: boolean;
    };
    preferences: {
      theme?: 'dark' | 'light';
      language?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }
