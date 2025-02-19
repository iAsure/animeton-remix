import { FC, useEffect, useState, useCallback } from 'react';
import { Divider } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { throttle } from '@utils/functions';

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
  const [throttledPeers, setThrottledPeers] = useState(numPeers);

  const updatePeers = useCallback(
    throttle((value: number) => {
      setThrottledPeers(value);
    }, 5000),
    []
  );

  useEffect(() => {
    updatePeers(numPeers);
  }, [numPeers, updatePeers]);

  return (
    <div
      className={`absolute top-14 left-0 max-w-[50vw] text-white transition-opacity duration-300 bg-gradient-to-r from-black/80 to-transparent p-4 ${
        !isMouseMoving ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        zIndex: 1000,
      }}
    >
      <h1 className="text-2xl font-bold max-w-[50vw] truncate">{animeName}</h1>
      {episodeNumber && (
        <p className="text-lg mb-1">Episodio {episodeNumber}</p>
      )}
      {throttledPeers > 0 && (
        <>
          <Divider className="my-2" />
          <p className="text-sm text-gray-300 flex items-center">
            <Icon icon="mdi:account-outline" className="mr-1" />
            {throttledPeers}{' '}
            {throttledPeers === 1 ? 'usuario viendo' : 'usuarios viendo'}
          </p>
        </>
      )}
    </div>
  );
};

export default VideoInfo;
