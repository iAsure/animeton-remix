import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from '@remix-run/react';
import log from 'electron-log';

import { IPC_CHANNELS } from '@electron/constants/event-channels';


import useTorrentStream from '@hooks/useTorrentStream';
import useSubtitles from '@hooks/useSubtitles';
import useApiSubtitles from '@hooks/useApiSubtitles';
import useChapters from '@hooks/useChapters';
import useUserActivity from '@hooks/useUserActivity';
import useCanvasRpcFrame from '@hooks/useCanvasRpcFrame';

import VideoSpinner from '@components/video/VideoSpinner';
import VideoControls from '@components/video/VideoControls';
import VideoPlayPauseOverlay from '@components/video/VideoPlayPauseOverlay';
import SubtitleStatus from '@components/video/SubtitleStatus';
import VideoInfo from '@components/video/VideoInfo';
import DiscordStatus from '@components/core/DiscordStatus';

import usePlayerStore from '@stores/player';

import { useNotification } from '@context/NotificationContext';
import { useConfig } from '@context/ConfigContext';

const Player = () => {
  const {
    isPlaying,
    isFullscreen,
    duration,
    subtitleContent,
    isMouseMoving,
    setMouseMoving,
    setIsPlaying,
    setPlayLastAction,
    reset,
  } = usePlayerStore();
  const { config } = useConfig();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { updateProgress, getEpisodeProgress, history } = useUserActivity();

  const animeData = state?.animeData;

  const torrentUrl = searchParams.get('url');
  const torrentHash = searchParams.get('hash');

  const videoRef = useRef<HTMLVideoElement>(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isLocalBuffering, setIsLocalBuffering] = useState(false);
  let mouseTimer: NodeJS.Timeout;

  const {
    progress,
    downloadSpeed,
    uploadSpeed,
    numPeers,
    ready: torrentReady,
    error: torrentError,
  } = useTorrentStream(torrentUrl, torrentHash);
  const { loadApiSubtitles } = useSubtitles(videoRef, isVideoReady);
  const { subtitles, fetchSubtitles } = useApiSubtitles(torrentHash);
  const { chapters } = useChapters();

  const isLoadingVideo =
    isLocalBuffering || (!subtitleContent?.length && !torrentReady);

  const animeHistoryData = history?.episodes[torrentHash];

  const animeImage = animeHistoryData?.animeImage ||
    animeData?.coverImage?.extraLarge ||
    animeData?.bannerImage ||
    animeData?.image;
  const animeTitle =
    animeHistoryData?.animeName ||
    animeData?.title?.english ||
    animeData?.title?.romaji ||
    animeData?.torrent?.title;
  const animeEpisode = animeHistoryData?.episodeNumber || animeData?.torrent?.episode;

  const rpcFrame = useCanvasRpcFrame({ imageUrl: animeImage }) || null;

  useEffect(() => {
    if (subtitles) {
      loadApiSubtitles(subtitles);
    }
  }, [subtitles]);

  useEffect(() => {
    if (torrentHash) {
      fetchSubtitles();
    }
  }, [torrentHash, fetchSubtitles]);

  useEffect(() => {
    if (torrentError) {
      log.error('Torrent error:', torrentError);

      showNotification({
        title: 'Error',
        message: torrentError,
        type: 'error',
      });
      navigate('/', { viewTransition: true });
    }
  }, [torrentError]);

  useEffect(() => {
    if (torrentHash && videoRef.current) {
      getEpisodeProgress(torrentHash).then(episode => {
        if (episode?.progressData.progress) {
          videoRef.current!.currentTime = 
            episode.progressData.progress * episode.progressData.duration;
        }
      });
    }
  }, [torrentHash]);

  useEffect(() => {
    if (!torrentHash || !duration || !animeData) return;

    const episodeInfo = {
      animeName: animeTitle,
      animeImage: animeImage,
      animeIdAnilist: animeData?.idAnilist || null,
      episodeImage: animeData?.image || animeData?.episode?.image || null,
      episodeNumber: animeEpisode || null,
      episodeTorrentUrl: torrentUrl,
      pubDate: animeData?.torrent?.pubDate || animeData?.torrent?.date || new Date(),
    };

    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const progress = videoRef.current.currentTime / duration;
        updateProgress(torrentHash, progress, duration, episodeInfo);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [torrentHash, duration, updateProgress, animeData]);

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
      const { url } = data;
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

  useEffect(() => {
    return () => {
      if (isFullscreen) {
        window.electron.ipc.send(IPC_CHANNELS.WINDOW.SET_FULLSCREEN, false);
      }

      if (videoRef.current) {
        videoRef.current.src = '';
      }
    };
  }, [isFullscreen]);

  return (
    <div
      className={`absolute w-full h-full overflow-hidden ${
        !isMouseMoving ? 'cursor-none' : ''
      }`}
      onMouseMove={handleMouseMove}
    >
      <DiscordStatus
        options={{
          details: animeTitle,
          state: animeEpisode ? `Episodio ${animeEpisode}` : null,
          assets: {
            large_image: rpcFrame,
            small_image: isPlaying ? 'play' : 'pause',
            small_text: isPlaying ? 'Reproduciendo' : 'Pausado',
          },
        }}
      />
      <VideoInfo
        animeName={animeTitle}
        episodeNumber={animeEpisode}
        numPeers={numPeers}
        isMouseMoving={isMouseMoving}
      />
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
      <VideoControls videoRef={videoRef} chapters={chapters} />
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
