import { useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_RPC_OPTIONS } from '@constants/discord-rpc';
import type { DiscordStatusProps, DiscordRPCOptions } from '@shared/types/discord';

const DiscordStatus = ({ 
  options = {}, 
  autoTimestamp = true 
}: DiscordStatusProps) => {
  const updateDiscordStatus = useCallback((rpcOptions: Partial<DiscordRPCOptions>) => {
    const mergedOptions = {
      ...DEFAULT_RPC_OPTIONS,
      ...rpcOptions,
      assets: {
        ...DEFAULT_RPC_OPTIONS.assets,
        ...rpcOptions.assets
      },
      buttons: rpcOptions.buttons || DEFAULT_RPC_OPTIONS.buttons,
      timestamps: {
        start: autoTimestamp ? Date.now() : rpcOptions.timestamps?.start ?? Date.now(),
        ...(rpcOptions.timestamps?.end && { end: rpcOptions.timestamps.end })
      }
    };

    window.api.discord.setActivity({
      activity: mergedOptions
    });
  }, [autoTimestamp]);

  // Memoize the merged options to prevent unnecessary updates
  const currentOptions = useMemo(() => ({
    ...options
  }), [options]);

  useEffect(() => {
    updateDiscordStatus({
        ...currentOptions,
        timestamps: {
          start: Date.now(),
          ...currentOptions.timestamps
        }
      });

  }, [currentOptions, updateDiscordStatus]);

  return null;
};

export default DiscordStatus;
