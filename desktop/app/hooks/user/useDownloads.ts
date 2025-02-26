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
  const { history } = useUserActivity();

  const updateDownloads = useCallback((activeTorrents: ActiveTorrent[]) => {
    if (!history || !activeTorrents) return;

    const activeTorrentsMap = new Map(
      activeTorrents.map(torrent => [torrent.infoHash.toLowerCase(), torrent])
    );

    const newDownloads = Object.entries(history.episodes)
      .filter(([episodeId, _]) => {
        return activeTorrentsMap.has(episodeId.toLowerCase());
      })
      .map(([episodeId, episode]) => {
        const activeTorrent = activeTorrentsMap.get(episodeId.toLowerCase());
        
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
      const filteredVisual = prevVisual.filter(visual => {
        return activeTorrentsMap.has(visual.torrentHash.toLowerCase());
      });
      
      const updatedVisual = [...filteredVisual];
      
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

      return updatedVisual;
    });
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

  const removeDownload = useCallback((episodeId: string) => {
    setDownloads(prev => 
      prev.filter(download => download.episodeId !== episodeId)
    );
    
    setVisualDownloads(prev => 
      prev.filter(download => download.episodeId !== episodeId)
    );
  }, []);

  return {
    downloads,
    visualDownloads,
    hasActiveDownloads: downloads.length > 0,
    hasVisualDownloads: visualDownloads.length > 0,
    removeDownload,
    getDownloadByEpisodeId: useCallback((episodeId: string) => {
      return visualDownloads.find(d => d.episodeId === episodeId);
    }, [visualDownloads])
  };
};

export default useDownloads; 