import { useState, useRef, useCallback, useEffect, use } from 'react';
import { useSearchParams } from '@remix-run/react';

import log from 'electron-log';

import useTorrentStream from '@hooks/useTorrentStream';
import useSubtitles from '@hooks/useSubtitles';
import useApiSubtitles from '@hooks/useApiSubtitles';

import VideoSpinner from '@components/video/VideoSpinner';
import VideoControls from '@components/video/VideoControls';
import VideoPlayPauseOverlay from '@components/video/VideoPlayPauseOverlay';
import SubtitleStatus from '@/shared/components/video/SubtitleStatus';

import usePlayerStore from '@stores/player';

import { useConfig } from '@context/ConfigContext';

const Player = () => {
  const { subtitleContent, isMouseMoving, setMouseMoving, setIsPlaying, setPlayLastAction, reset } =
    usePlayerStore();
  const { config } = useConfig();

  const [searchParams] = useSearchParams();
  const torrentUrl = searchParams.get('url');

  const videoRef = useRef<HTMLVideoElement>(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isLocalBuffering, setIsLocalBuffering] = useState(false);
  let mouseTimer: NodeJS.Timeout;

  const {
    progress,
    downloadSpeed,
    uploadSpeed,
    ready: torrentReady,
    error: torrentError
  } = useTorrentStream(torrentUrl);

  const isLoadingVideo = subtitleContent?.length === 0 && !torrentReady;

  const { infoHash, loadApiSubtitles } = useSubtitles(videoRef, isVideoReady);

  const { subtitles, fetchSubtitles } = useApiSubtitles(infoHash);

  useEffect(() => {
    if (subtitles) {
      loadApiSubtitles(subtitles);
    }
  }, [subtitles]);

  useEffect(() => {
    if (infoHash) {
      log.info('API_SUBTITLES: Fetching subtitles for infoHash:', infoHash);
      fetchSubtitles();
    }
  }, [infoHash, fetchSubtitles]);

  useEffect(() => {
    if (torrentError) {
      log.error('Torrent error:', torrentError);
      // You could show a toast/notification here
    }
  }, [torrentError]);

  const handleVideoWaiting = useCallback(() => {
    setIsLocalBuffering(true);
  }, []);

  const handleVideoReady = useCallback(() => {
    log.info('Video ready');
    setIsVideoReady(true);
  }, []);

  const handleVideoClick = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlayLastAction('play');
    } else {
      videoRef.current.pause();
      setPlayLastAction('pause');
    }
  }, [setPlayLastAction]);

  const handleVideoPlay = useCallback(() => {
    if (videoRef.current) {
      setIsPlaying(true);
      videoRef.current.play().catch((error) => {
        log.error('Error playing video', { error });
      });
    }
  }, [setIsPlaying]);

  const handleCanPlay = useCallback(() => {
    setIsLocalBuffering(false);
    handleVideoReady();
  }, [handleVideoReady]);

  const handleMouseMove = useCallback(() => {
    setMouseMoving(true);
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => setMouseMoving(false), 3000);
  }, [setMouseMoving]);

  useEffect(() => {
    const handleTorrentServerDone = (event: any, data: any) => {
      const { url, filePath } = data;
      if (videoRef.current) {
        videoRef.current.src = url;
      }
    };

    window.api.torrent.onServerDone.subscribe(handleTorrentServerDone);

    return () => {
      window.api.torrent.onServerDone.unsubscribe(handleTorrentServerDone);
      clearTimeout(mouseTimer);
      reset();
    };
  }, [reset]);

  return (
    <div
      className={`absolute w-full h-full overflow-hidden ${
        !isMouseMoving ? 'cursor-none' : ''
      }`}
      onMouseMove={handleMouseMove}
    >
      <video
        id="output"
        ref={videoRef}
        autoPlay
        className="w-full h-full max-w-[100vw] max-h-[100vh] flex bg-cover bg-center object-contain"
        onClick={handleVideoClick}
        onCanPlay={handleCanPlay}
        onPlay={handleVideoPlay}
        onWaiting={handleVideoWaiting}
        crossOrigin="anonymous"
      />
      {config?.features?.subtitlesStatus && <SubtitleStatus />}
      <VideoPlayPauseOverlay />
      <VideoControls videoRef={videoRef} />
      {isLoadingVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <VideoSpinner
            progress={progress}
            downloadSpeed={downloadSpeed}
            uploadSpeed={uploadSpeed}
          />
        </div>
      )}
      {torrentError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-red-500 text-lg">
            Error loading video: {torrentError}
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
