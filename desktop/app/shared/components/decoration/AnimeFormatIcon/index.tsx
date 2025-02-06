import { FC } from 'react';
import { Icon } from '@iconify/react';

interface AnimeFormatIconProps {
  format: string;
}

const AnimeFormatIcon: FC<AnimeFormatIconProps> = ({ format }) => {
  const icons = {
    TV: 'gravity-ui:tv',
    MOVIE: 'gravity-ui:video',
    OVA: 'gravity-ui:tv',
    ONA: 'gravity-ui:tv',
    MUSIC: 'gravity-ui:music-note',
    MANGA: 'gravity-ui:book-open',
    NOVEL: 'gravity-ui:book-open',
    ONE_SHOT: 'gravity-ui:book-open',
  };

  const iconName = icons[format];
  if (!iconName) return null;

  return <Icon icon={iconName} />;
};

export default AnimeFormatIcon;
