export interface DiscordRPCTimestamps {
  start: number;
  end?: number;
}

export interface DiscordRPCOptions {
  details?: string;
  state?: string;
  timestamps: DiscordRPCTimestamps;
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  buttons?: Array<{
    label: string;
    url: string;
  }>;
  instance?: boolean;
  type?: number;
}

export interface DiscordStatusProps {
  options?: Partial<Omit<DiscordRPCOptions, 'timestamps'>> & {
    timestamps?: Partial<DiscordRPCTimestamps>;
  };
  enabled?: boolean;
  autoTimestamp?: boolean;
}
