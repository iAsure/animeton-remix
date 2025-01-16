import { createContext, useContext, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useNotification } from '@context/NotificationContext';
import log from 'electron-log';

interface TorrentPlayerContextType {
  loadingHash: string | null;
  playEpisode: (episode: {
    torrent?: {
      hash?: string;
      infoHash?: string;
      link?: string;
      torrentUrl?: string;
    };
  }) => void;
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
  const { showNotification } = useNotification();
  const [loadingHash, setLoadingHash] = useState<string | undefined>('');

  const playEpisode = (episode) => {
    const torrentLink = episode?.episodeTorrentUrl || episode?.torrent?.link || episode?.torrent?.torrentUrl;
    const infoHash = episode?.episodeId || episode?.torrent?.hash || episode?.torrent?.infoHash;

    if (!torrentLink) {
      showNotification({
        title: 'No disponible...',
        message: 'Vuelve a intentarlo más tarde',
        type: 'warning',
      });
      return;
    }

    setLoadingHash(infoHash);
    const encodedUrl = encodeURIComponent(torrentLink);
    navigate(
      `/player?url=${encodedUrl}&hash=${infoHash}`,
      {
        viewTransition: true,
        state: {
          animeData: episode,
        },
      }
    );
    setLoadingHash('');
  };

  return (
    <TorrentPlayerContext.Provider value={{ loadingHash, playEpisode }}>
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
