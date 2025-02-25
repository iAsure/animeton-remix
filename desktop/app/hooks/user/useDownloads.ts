import { useCallback, useEffect, useState } from 'react';
import useUserActivity from '@hooks/user/useUserActivity';

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
  completed: boolean;
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
  status: 'downloading' | 'paused' | 'completed';
}

const useDownloads = () => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [visualDownloads, setVisualDownloads] = useState<Download[]>([]);
  const [activeTorrents, setActiveTorrents] = useState<ActiveTorrent[]>([]);
  const { history } = useUserActivity();

  const updateDownloads = useCallback((torrents: ActiveTorrent[]) => {
    if (!history || !torrents) return;

    const newDownloads = Object.entries(history.episodes)
      .filter(([episodeId, _]) => {
        const activeTorrent = torrents?.find(
          torrent => torrent?.infoHash?.toLowerCase() === episodeId?.toLowerCase()
        );
        return activeTorrent !== undefined;
      })
      .map(([episodeId, episode]) => {
        const activeTorrent = torrents?.find(
          t => t?.infoHash?.toLowerCase() === episodeId?.toLowerCase()
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
            completed: false,
          },
          episodeInfo: {
            animeName: episode.animeName,
            animeImage: episode.animeImage,
            animeIdAnilist: episode.animeIdAnilist,
            episodeImage: episode.episodeImage,
            episodeNumber: episode.episodeNumber,
            episodeTorrentUrl: episode.episodeTorrentUrl,
            pubDate: episode.pubDate,
          },
          status: 'downloading'
        };

        return download;
      });

    setDownloads(newDownloads);
    
    setVisualDownloads(prevVisual => {
      const updatedVisual = [...prevVisual];
      
      newDownloads.forEach(download => {
        const existingIndex = updatedVisual.findIndex(d => d.episodeId === download.episodeId);
        if (existingIndex >= 0) {
          updatedVisual[existingIndex] = {
            ...download,
            status: 'downloading'
          };
        } else {
          updatedVisual.push(download);
        }
      });

      prevVisual.forEach(visual => {
        if (!newDownloads.find(d => d.episodeId === visual.episodeId)) {
          const existingIndex = updatedVisual.findIndex(d => d.episodeId === visual.episodeId);
          if (existingIndex >= 0) {
            updatedVisual[existingIndex] = {
              ...visual,
              status: 'paused'
            };
          }
        }
      });

      return updatedVisual;
    });
  }, [history]);

  useEffect(() => {
    if (history && activeTorrents.length > 0) {
      updateDownloads(activeTorrents);
    }
  }, [history, activeTorrents, updateDownloads]);

  useEffect(() => {
    const initializeDownloads = async () => {
      try {
        const torrents = await window.api.torrent.getActiveTorrents();
        setActiveTorrents(torrents);
      } catch (error) {
        console.error('Error fetching active torrents:', error);
      }
    };

    initializeDownloads();

    const handleActiveTorrents = (_: any, torrents: ActiveTorrent[]) => {
      setActiveTorrents(torrents);
    };

    window.api.torrent.onActiveTorrents.subscribe(handleActiveTorrents);

    return () => {
      window.api.torrent.onActiveTorrents.unsubscribe(handleActiveTorrents);
    };
  }, []);

  return {
    downloads,
    visualDownloads,
    hasActiveDownloads: downloads.length > 0,
    hasVisualDownloads: visualDownloads.length > 0,
    getDownloadByEpisodeId: useCallback((episodeId: string) => {
      return visualDownloads.find(d => d.episodeId === episodeId);
    }, [visualDownloads])
  };
};

export default useDownloads; 