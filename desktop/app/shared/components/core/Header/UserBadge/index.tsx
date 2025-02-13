import { useEffect, useRef } from 'react';

import { Skeleton } from '@nextui-org/react';
import { useAmplitude } from '@lib/amplitude';

import { useConfig } from '@context/ConfigContext';

import useDiscordUser from '@hooks/user/useDiscordUser';

interface UserBadgeProps {
  discordId: string;
}

const UserBadge = ({ discordId }: UserBadgeProps) => {
  const amplitude = useAmplitude();
  const { config } = useConfig();
  const { data: userData, isLoading } = useDiscordUser(discordId);

  const identifySentRef = useRef(false);

  const appKey = config?.user?.activationKey;
  const discordUser = userData?.discord;

  useEffect(() => {
    if (discordUser && !identifySentRef.current) {
      amplitude?.setUserId(`${discordUser.username}-${discordUser.id}`);
      amplitude?.setSessionId(Date.now());

      identifySentRef.current = true;
    }
  }, [userData, appKey]);

  return (
    <div className="flex items-center gap-3 bg-zinc-900/50 rounded-full px-3 py-1.5 webkit-app-region-no-drag relative">
      {isLoading ? (
        <Skeleton className="w-24" />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <img
              src={userData?.discord?.avatarURL}
              alt={userData?.discord?.username}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-white text-sm font-medium">
              {userData?.discord?.username}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-800/80 rounded-full px-2 py-0.5">
            <img src={'icons/coin.png'} alt="coin" className="w-3.5 h-3.5" />
            <span className="text-white text-xs font-medium">
              {userData?.user?.coins || 0}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default UserBadge;
