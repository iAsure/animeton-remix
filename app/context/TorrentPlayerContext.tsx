import { createContext, useContext, useState } from 'react';
import { useNavigate } from '@remix-run/react';

interface TorrentPlayerContextType {
  loadingHash: string | null;
  playTorrent: (torrent: { infoHash: string; link: string }) => void;
}

const TorrentPlayerContext = createContext<
  TorrentPlayerContextType | undefined
>(undefined);

export const TorrentPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const navigate = useNavigate();
  const [loadingHash, setLoadingHash] = useState<string | null>(null);

  const playTorrent = (torrent: { infoHash: string; link: string }) => {
    setLoadingHash(torrent.infoHash);
    const encodedUrl = encodeURIComponent(torrent.link);
    navigate(`/player?url=${encodedUrl}&hash=${torrent.infoHash}`, {
      viewTransition: true,
    });
  };

  return (
    <TorrentPlayerContext.Provider value={{ loadingHash, playTorrent }}>
      {children}
    </TorrentPlayerContext.Provider>
  );
};

export const useTorrentPlayer = () => {
  const context = useContext(TorrentPlayerContext);
  if (!context) {
    throw new Error(
      'useTorrentPlayer must be used within TorrentPlayerProvider'
    );
  }
  return context;
};
