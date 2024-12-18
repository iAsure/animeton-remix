import { Icon } from '@iconify/react';
import { Button, Divider, Skeleton } from '@nextui-org/react';
import useDiscordUser from '@hooks/useDiscordUser';
import SettingsMenu from '@components/core/Header/SettingsMenu';
import { useState } from 'react';

import NewBadge from '@components/decoration/NewBadge';

interface UserBadgeProps {
  discordId: string;
}

const UserBadge = ({ discordId }: UserBadgeProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: userData, isLoading } = useDiscordUser(discordId);

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
          <Divider orientation="vertical" className="bg-zinc-800 h-6" />

          <NewBadge>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="text-white bg-zinc-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Icon icon="gravity-ui:sliders" width="22" height="22" />
            </Button>
          </NewBadge>

          {isMenuOpen && <SettingsMenu onClose={() => setIsMenuOpen(false)} />}
        </>
      )}
    </div>
  );
};

export default UserBadge;
