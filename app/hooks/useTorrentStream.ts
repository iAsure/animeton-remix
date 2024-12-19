import { useState, useEffect, useCallback, useRef } from 'react';
import log from 'electron-log';
import { prettyBytes } from '@/shared/utils/strings';

interface TorrentStreamState {
  progress: number;
  downloadSpeed: string;
  uploadSpeed: string;
  numPeers: number;
  downloaded: string;
  total: string;
  remaining: string;
  isBuffering: boolean;
  ready: boolean;
  error: string | null;
  url?: string;
}

const INITIAL_STATE: TorrentStreamState = {
  progress: 0,
  downloadSpeed: '0 B/s',
  uploadSpeed: '0 B/s',
  numPeers: 0,
  downloaded: '0 B',
  total: '0 B',
  remaining: 'Calculating...',
  isBuffering: true,
  ready: false,
  error: null
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const useTorrentStream = (torrentId: string) => {
  const [state, setState] = useState<TorrentStreamState>(INITIAL_STATE);
  const [retryCount, setRetryCount] = useState(0);

  // Track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const startTorrent = useCallback(async () => {
    if (!torrentId || !isMounted.current) return;

    try {
      log.info('Starting torrent stream', { torrentId, attempt: retryCount + 1 });
      setState(prev => ({ ...prev, error: null, isBuffering: true }));
      window.api.addTorrent(torrentId);
    } catch (error) {
      if (!isMounted.current) return;
      
      log.error('Error starting torrent:', error);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          if (isMounted.current) {
            setRetryCount(prev => prev + 1);
          }
        }, RETRY_DELAY);
      } else {
        setState(prev => ({
          ...prev,
          error: 'Failed to start torrent after multiple attempts',
          isBuffering: false
        }));
      }
    }
  }, [torrentId, retryCount]);

  useEffect(() => {
    if (!torrentId) return;

    const handleProgress = (_: any, data: any) => {
      if (!isMounted.current) return;
      setState(prev => ({
        ...prev,
        progress: Math.round(data.progress * 100 * 100) / 100,
        downloadSpeed: prettyBytes(data.downloadSpeed) + '/s',
        uploadSpeed: prettyBytes(data.uploadSpeed) + '/s',
        numPeers: data.numPeers,
        downloaded: prettyBytes(data.downloaded),
        total: prettyBytes(data.total),
        remaining: data.remaining === 'Done' ? 'Complete' : data.remaining,
        isBuffering: data.isBuffering,
        ready: data.ready
      }));
    };

    const handleServerDone = (_: any, data: any) => {
      setState(prev => ({
        ...prev,
        url: data.url,
        ready: true
      }));
    };

    const handleError = (_: any, error: any) => {
      log.error('Torrent error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Unknown error occurred',
        isBuffering: false
      }));

      // Retry on specific errors
      if (retryCount < MAX_RETRIES && error.message?.includes('Invalid torrent')) {
        setTimeout(() => setRetryCount(prev => prev + 1), RETRY_DELAY);
      }
    };

    // Subscribe to events
    window.api.torrent.onProgress.subscribe(handleProgress);
    window.api.torrent.onServerDone.subscribe(handleServerDone);
    window.api.torrent.onError.subscribe(handleError);

    // Start torrent with a small delay to avoid race conditions
    const timeoutId = setTimeout(() => startTorrent(), 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.api.torrent.onProgress.unsubscribe(handleProgress);
      window.api.torrent.onServerDone.unsubscribe(handleServerDone);
      window.api.torrent.onError.unsubscribe(handleError);
      
      // Only destroy if we're unmounting
      if (!isMounted.current) {
        window.api.addTorrent('destroy');
      }
      setState(INITIAL_STATE);
    };
  }, [torrentId, startTorrent]);

  return state;
};

export default useTorrentStream;
