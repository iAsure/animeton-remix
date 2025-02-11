import { useCallback, useEffect, useState } from 'react';
import useUserActivity from '@hooks/useUserActivity';

interface TorrentProgress {
  numPeers: number;
  downloaded: number;
  total: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  remaining: string;
  isBuffering: boolean;
  ready: boolean;
}

interface ActiveTorrent {
  infoHash: string;
  name: string;
  created: number;
  progress: TorrentProgress;
}

interface Download {
  episodeId: string;
  torrentHash: string;
  progress: TorrentProgress;
  episodeInfo: {
    animeName: string;
    animeImage: string;
    animeIdAnilist: number;
    episodeImage: string;
    episodeNumber: number;
    episodeTorrentUrl: string;
    pubDate: string;
  };
}

const useDownloads = () => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const { history } = useUserActivity();

  const updateDownloads = useCallback((activeTorrents: ActiveTorrent[]) => {
    if (!history) {
      return;
    }

    const newDownloads = Object.entries(history.episodes)
      .filter(([episodeId, _]) => {
        const activeTorrent = activeTorrents.find(
          torrent => torrent.infoHash.toLowerCase() === episodeId.toLowerCase()
        );

        return activeTorrent !== undefined;
      })
      .map(([episodeId, episode]) => {
        const activeTorrent = activeTorrents.find(
          t => t.infoHash.toLowerCase() === episodeId.toLowerCase()
        );
        
        const download: Download = {
          episodeId,
          torrentHash: episodeId,
          progress: activeTorrent?.progress || {
            numPeers: 0,
            downloaded: 0,
            total: 0,
            progress: 0,
            downloadSpeed: 0,
            uploadSpeed: 0,
            remaining: '',
            isBuffering: false,
            ready: false,
          },
          episodeInfo: {
            animeName: episode.animeName,
            animeImage: episode.animeImage,
            animeIdAnilist: episode.animeIdAnilist,
            episodeImage: episode.episodeImage,
            episodeNumber: episode.episodeNumber,
            episodeTorrentUrl: episode.episodeTorrentUrl,
            pubDate: episode.pubDate,
          }
        };

        return download;
      });

    setDownloads(newDownloads);
  }, [history]);

  useEffect(() => {
    const initializeDownloads = async () => {
      try {
        const activeTorrents = await window.api.torrent.getActiveTorrents();
        updateDownloads(activeTorrents);
      } catch (error) {
        console.error('Error fetching active torrents:', error);
      }
    };

    initializeDownloads();

    const handleActiveTorrents = (_: any, activeTorrents: ActiveTorrent[]) => {
      updateDownloads(activeTorrents);
    };

    window.api.torrent.onActiveTorrents.subscribe(handleActiveTorrents);

    return () => {
      window.api.torrent.onActiveTorrents.unsubscribe(handleActiveTorrents);
    };
  }, [updateDownloads]);

  return {
    downloads,
    hasActiveDownloads: downloads.length > 0,
    getDownloadByEpisodeId: useCallback((episodeId: string) => {
      return downloads.find(d => d.episodeId === episodeId);
    }, [downloads])
  };
};

export default useDownloads; 