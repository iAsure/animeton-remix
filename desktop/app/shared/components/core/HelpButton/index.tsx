import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useLocation } from '@remix-run/react';

import { useModal } from '@context/ModalContext';
import { useConfig } from '@context/ConfigContext';

import DiscordTicketModal from '@components/modals/DiscordTicket';

const HelpButton = () => {
  const location = useLocation();
  const { openModal } = useModal();
  const { config } = useConfig();

  const handleHelpClick = () => {
    openModal('discord-ticket', ({ onClose }) => (
      <DiscordTicketModal onClose={onClose} userId={config.user?.discordId} />
    ));
  };

  if (location.pathname === '/player') {
    return null;
  }

  return (
    <Button
      isIconOnly
      color="default"
      variant="shadow"
      radius="full"
      size="lg"
      className="fixed bottom-6 right-6 shadow-lg hover:scale-105 transition-transform bg-white"
      style={{ zIndex: 9999 }}
      onClick={handleHelpClick}
    >
      <Icon
        icon="hugeicons:question"
        width="32"
        height="32"
        className="text-black pointer-events-none"
      />
    </Button>
  );
};

export default HelpButton;
