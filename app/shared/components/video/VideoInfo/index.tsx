import { FC } from 'react';
import { Divider } from '@nextui-org/react';
import { Icon } from '@iconify/react';

interface VideoInfoProps {
  animeName: string;
  episodeNumber: number | null;
  numPeers: number;
  isMouseMoving: boolean;
}

const VideoInfo: FC<VideoInfoProps> = ({
  animeName,
  episodeNumber,
  numPeers,
  isMouseMoving,
}) => {
  return (
    <div
      className={`absolute top-14 left-4 text-white transition-opacity duration-300 bg-gradient-to-r from-black/80 to-transparent p-4 rounded-lg ${
        !isMouseMoving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <h1 className="text-2xl font-bold">{animeName}</h1>
      {episodeNumber && (
        <p className="text-lg mb-1">Episodio {episodeNumber}</p>
      )}
      <Divider className="my-2" />
      <p className="text-sm text-gray-300 flex items-center">
        <Icon icon="mdi:account-outline" className="mr-1" />
        {numPeers} {numPeers === 1 ? 'usuario viendo' : 'usuarios viendo'}
      </p>
    </div>
  );
};

export default VideoInfo; 