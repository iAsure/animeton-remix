import { useState, useEffect, useCallback, useRef } from 'react';
import { prettyBytes } from '@/shared/utils/strings';
import usePlayerStore from '@stores/player';

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
  fileProgress?: any;
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
  error: null,
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const useTorrentStream = (torrentUrl: string, torrentHash: string) => {
  const { setTorrentRanges, setTorrentProgress } = usePlayerStore();
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
    if (!torrentUrl || !isMounted.current) return;

    try {
      console.info('Starting torrent stream', {
        torrentUrl,
        attempt: retryCount + 1,
      });
      setState((prev) => ({ ...prev, error: null, isBuffering: true }));

      if (retryCount === 0) {
        try {
          await window.api.torrent.add({ torrentUrl, torrentHash });
        } catch (error) {
          console.error('Error caught from torrent.add:', error);
          if (isMounted.current) {
            const errorMessage =
              error?.message || 'Error al iniciar el torrent';
            console.warn(
              'Setting error state from caught error:',
              errorMessage
            );
            setState((prev) => ({
              ...prev,
              error: error.message || 'Error al iniciar el torrent',
              isBuffering: false,
            }));
          }
        }
      }
    } catch (error) {
      if (!isMounted.current) return;

      console.error('Error starting torrent:', error);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          if (isMounted.current) {
            setRetryCount((prev) => prev + 1);
          }
        }, RETRY_DELAY);
      } else {
        const errorMessage =
          error?.message || 'No se pudo reproducir después de varios intentos';
        console.warn('Setting error state after max retries:', errorMessage);
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isBuffering: false,
        }));
      }
    }
  }, [torrentUrl, torrentHash, retryCount]);

  const checkServerStatus = useCallback(async () => {
    if (!torrentUrl) return;
    try {
      await window.api.torrent.checkServer();
    } catch (error) {
      console.error('Error checking server status:', error);
      if (isMounted.current && retryCount >= MAX_RETRIES) {
        setState((prev) => ({
          ...prev,
          error: 'Error de conexión con el servidor torrent',
          isBuffering: false,
        }));
      }
    }
  }, [torrentUrl, retryCount]);

  useEffect(() => {
    if (!torrentUrl) return;

    const handleProgress = (_: any, data: any) => {
      if (!isMounted.current) return;
      setState((prev) => ({
        ...prev,
        progress: Math.round(data.progress * 100 * 100) / 100,
        downloadSpeed: prettyBytes(data.downloadSpeed) + '/s',
        uploadSpeed: prettyBytes(data.uploadSpeed) + '/s',
        numPeers: data.numPeers,
        downloaded: prettyBytes(data.downloaded),
        total: prettyBytes(data.total),
        remaining: data.remaining === 'Done' ? 'Complete' : data.remaining,
        isBuffering: data.isBuffering,
        ready: data.ready,
      }));
    };

    const handleDownloadRanges = (_: any, data: any) => {
      if (!isMounted.current) return;

      // Update the store with the new ranges and progress
      setTorrentRanges(data.ranges);
      setTorrentProgress(data.progress);

      // Update state with file-specific progress info if needed
      setState((prev) => ({
        ...prev,
        fileProgress: data.fileProgress,
        progress: Math.round(data.progress * 100 * 100) / 100,
      }));
    };

    const handleServerDone = (_: any, data: any) => {
      setState((prev) => ({
        ...prev,
        url: data.url,
        ready: true,
      }));
    };

    const handleError = (_: any, error: any) => {
      console.error('Torrent error received in hook:', error);

      let errorMessage = 'Error desconocido';

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = error.error || error.message || 'Error en el torrent';
      }

      const isNetworkError =
        errorMessage.includes('Invalid torrent') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('Error downloading torrent') ||
        errorMessage.includes('Timeout');

      console.warn('Setting error state from event:', errorMessage);
      setState((prev) => ({
        ...prev,
        error: isNetworkError ? 'No se pudo descargar el torrent. Verifica tu conexión a internet o intenta con otro episodio.' : errorMessage,
        isBuffering: false,
      }));

      // Retry on specific errors
      const shouldRetry = retryCount < MAX_RETRIES && isNetworkError;

      if (shouldRetry) {
        console.info(`Retrying torrent after error: ${errorMessage}`);
        setTimeout(() => setRetryCount((prev) => prev + 1), RETRY_DELAY);
      }
    };

    const handleServerStatus = (_: any, data: any) => {
      console.info('Torrent server status:', data);
      if (!data.active) {
        // Server is not healthy, retry torrent
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => setRetryCount((prev) => prev + 1), RETRY_DELAY);
        } else {
          console.warn('Setting error state from server status');
          setState((prev) => ({
            ...prev,
            error: 'Torrent server failed to initialize',
            isBuffering: false,
          }));
        }
      }
    };

    // Subscribe to events
    window.api.torrent.onProgress.subscribe(handleProgress);
    window.api.torrent.onDownloadRanges.subscribe(handleDownloadRanges);
    window.api.torrent.onServerDone.subscribe(handleServerDone);
    window.api.torrent.onError.subscribe(handleError);
    window.api.torrent.onServerStatus.subscribe(handleServerStatus);

    // Start torrent with a small delay to avoid race conditions
    const timeoutId = setTimeout(() => startTorrent(), 100);

    // Check server status periodically
    const statusCheckInterval = setInterval(checkServerStatus, 30000);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.api.torrent.onProgress.unsubscribe(handleProgress);
      window.api.torrent.onDownloadRanges.unsubscribe(handleDownloadRanges);
      window.api.torrent.onServerDone.unsubscribe(handleServerDone);
      window.api.torrent.onError.unsubscribe(handleError);
      window.api.torrent.onServerStatus.unsubscribe(handleServerStatus);

      // Only destroy if we're unmounting
      if (!isMounted.current) {
        // window.api.torrent.remove(torrentHash);
      }
      setState(INITIAL_STATE);
      clearInterval(statusCheckInterval);
    };
  }, [
    torrentUrl,
    startTorrent,
    checkServerStatus,
    retryCount,
    torrentHash,
    setTorrentRanges,
    setTorrentProgress,
  ]);

  return state;
};

export default useTorrentStream;
