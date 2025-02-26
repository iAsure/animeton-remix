import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from '@remix-run/react';

import { IPC_CHANNELS } from '@electron/constants/event-channels';

import useTorrentStream from '@hooks/media/useTorrentStream';
import useSubtitles from '@hooks/media/useSubtitles';
import useApiSubtitles from '@hooks/media/useApiSubtitles';
import useChapters from '@hooks/media/useChapters';
import useUserActivity from '@hooks/user/useUserActivity';
import useRpcFrame from '@hooks/canvas/useRpcFrame';
import useAnimeEpisodesData from '@hooks/anime/useAnimeEpisodesData';
import useSubtitleBuffering from '@hooks/media/useSubtitleBuffering';

import VideoSpinner from '@components/video/VideoSpinner';
import VideoControls from '@components/video/VideoControls';
import VideoPlayPauseOverlay from '@components/video/VideoPlayPauseOverlay';
import SubtitleStatus from '@components/video/SubtitleStatus';
import VideoInfo from '@components/video/VideoInfo';
import DiscordStatus from '@components/core/DiscordStatus';

import usePlayerStore from '@stores/player';

import { useNotification } from '@context/NotificationContext';
import { useConfig } from '@context/ConfigContext';
import { useTorrentPlayer } from '@context/TorrentPlayerContext';

import { useAmplitude } from '@lib/amplitude';

const Player = () => {
  const {
    isPlaying,
    isFullscreen,
    duration,
    isMouseMoving,
    setMouseMoving,
    setIsPlaying,
    setCurrentTime,
    setPlaybackState,
    setPlayLastAction,
    reset,
  } = usePlayerStore();
  const { config } = useConfig();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const amplitude = useAmplitude();
  const { playEpisode } = useTorrentPlayer();

  const { updateProgress, getEpisodeProgress, history } = useUserActivity();

  const animeData = state?.animeData;

  const torrentUrl = searchParams.get('url');
  const torrentHash = searchParams.get('hash');

  const videoRef = useRef<HTMLVideoElement>(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isLocalBuffering, setIsLocalBuffering] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  let mouseTimer: NodeJS.Timeout;

  const { episodes } = useAnimeEpisodesData(animeData?.idAnilist, true);
  const [nextEpisode, setNextEpisode] = useState<any>(null);

  const {
    progress,
    downloadSpeed,
    uploadSpeed,
    numPeers,
    error: torrentError,
    remaining,
  } = useTorrentStream(torrentUrl, torrentHash);
  const { loadApiSubtitles, clearSubtitles } = useSubtitles(
    videoRef,
    isVideoReady,
    torrentUrl
  );
  const { subtitles, fetchSubtitles } = useApiSubtitles(torrentHash);
  const { chapters } = useChapters();
  const { isWaitingForSubtitles } = useSubtitleBuffering({
    videoRef,
    isVideoReady,
    setIsLocalBuffering,
  });

  const isLoadingVideo =
    isLocalBuffering || 
    isWaitingForSubtitles ||
    !videoRef.current ||
    !videoRef.current.readyState ||
    videoRef.current.readyState < 3 ||
    (videoRef.current.duration === 0 && videoRef.current.currentTime === 0) ||
    (videoRef.current.duration === 0 || isNaN(videoRef.current.duration));

  const animeHistoryData = history?.episodes[torrentHash];

  const animeImage =
    animeHistoryData?.animeImage ||
    animeData?.coverImage?.extraLarge ||
    animeData?.bannerImage ||
    animeData?.image;
  const animeTitle =
    animeHistoryData?.animeName ||
    animeData?.title?.english ||
    animeData?.title?.romaji ||
    animeData?.torrent?.title;
  const animeEpisode =
    animeHistoryData?.episodeNumber || animeData?.torrent?.episode;

  const rpcFrame = useRpcFrame({ imageUrl: animeImage }) || null;

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      if (
        duration !== videoRef.current.duration &&
        !isNaN(videoRef.current.duration)
      ) {
        setPlaybackState(
          videoRef.current.currentTime,
          videoRef.current.duration
        );
      }
    }
  }, [setCurrentTime, setPlaybackState, duration]);

  useEffect(() => {
    if (episodes && animeEpisode) {
      const currentIndex = episodes.findIndex((ep) => {
        const episodeNumber =
          ep?.episodeNumber || ep?.episode || ep?.torrent?.episode;
        return episodeNumber === animeEpisode;
      });
      if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
        setNextEpisode(episodes[currentIndex + 1]);
      }
    }
  }, [episodes, animeEpisode]);

  const handleNextEpisode = useCallback(() => {
    if (nextEpisode) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      clearSubtitles();
      playEpisode(nextEpisode);
    }
  }, [nextEpisode, playEpisode, clearSubtitles]);

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
      console.error('Torrent error:', torrentError);

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
      getEpisodeProgress(torrentHash).then((episode) => {
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
      episodeFileName: animeData?.torrent?.fileName || null,
      pubDate:
        animeData?.torrent?.pubDate || animeData?.torrent?.date || new Date(),
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
    
    if (remaining === 'Complete' && videoRef.current) {
      setIsSeeking(true);
      
      const seekingTimeout = setTimeout(() => {
        if (videoRef.current) {
          const isStillWaiting = videoRef.current.readyState < 3;
          
          if (!isStillWaiting) {
            setIsLocalBuffering(false);
            setIsSeeking(false);
          }
        }
      }, 300);
      
      return () => clearTimeout(seekingTimeout);
    }
  }, [remaining]);

  const handleVideoReady = useCallback(() => {
    console.info('Video ready');
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
        console.error('Error playing video', { error });
      });
    }
  }, [setIsPlaying]);

  const handleCanPlay = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState >= 3 && videoRef.current.duration > 0) {
      setIsLocalBuffering(false);
      setIsSeeking(false);
      handleVideoReady();
    }
  }, [handleVideoReady]);

  const handleMouseMove = useCallback(() => {
    setMouseMoving(true);
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => setMouseMoving(false), 3000);
  }, [setMouseMoving]);

  const handleVideoSeeking = useCallback(() => {
    setIsSeeking(true);
  }, []);

  const handleVideoSeeked = useCallback(() => {
    setIsSeeking(false);
    if (videoRef.current && videoRef.current.readyState >= 3 && videoRef.current.duration > 0) {
      setIsLocalBuffering(false);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    console.info('Video metadata loaded');
  }, []);

  const handleLoadedData = useCallback(() => {
    console.info('Video data loaded');
    if (videoRef.current && videoRef.current.readyState >= 3 && videoRef.current.duration > 0) {
      setIsLocalBuffering(false);
    }
  }, []);

  useEffect(() => {
    if (videoRef.current && isVideoReady) {
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [videoRef, isVideoReady, handleTimeUpdate]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const checkReadyState = () => {
      if (videoRef.current) {
        const isReady = videoRef.current.readyState >= 3 && 
                        videoRef.current.duration > 0 && 
                        !isNaN(videoRef.current.duration);
        
        if (isReady && isLocalBuffering && !isWaitingForSubtitles) {
          console.info('Video ready state reached, disabling buffering');
          setIsLocalBuffering(false);
        }
      }
    };
    
    const intervalId = setInterval(checkReadyState, 100);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [videoRef, isLocalBuffering, isWaitingForSubtitles]);

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

      reset();

      if (videoRef.current) {
        videoRef.current.src = '';
      }
    };
  }, [reset]);

  useEffect(() => {
    return () => {
      if (isFullscreen) {
        window.electron.ipc.send(IPC_CHANNELS.WINDOW.SET_FULLSCREEN, false);
      }
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (animeData) {
      amplitude.track('Episode Viewed', {
        idAnilist: animeData.idAnilist,
        title: animeTitle,
        episode: animeEpisode,
        torrent: torrentUrl,
        hash: torrentHash,
      });
    }
  }, [animeData]);

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
        onSeeking={handleVideoSeeking}
        onSeeked={handleVideoSeeked}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        crossOrigin="anonymous"
      />
      {config?.features?.subtitlesStatus && <SubtitleStatus />}
      <VideoPlayPauseOverlay />
      <VideoControls
        videoRef={videoRef}
        chapters={chapters}
        onNextEpisode={handleNextEpisode}
        hasNextEpisode={!!nextEpisode}
        nextEpisodeData={{
          title: nextEpisode?.title,
          episodeNumber:
            nextEpisode?.episodeNumber ||
            nextEpisode?.episode ||
            nextEpisode?.torrent?.episode,
          image: nextEpisode?.image,
        }}
      />
      {isLoadingVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <VideoSpinner
            progress={progress}
            downloadSpeed={downloadSpeed}
            uploadSpeed={uploadSpeed}
            isWaitingForSubtitles={isWaitingForSubtitles}
            remaining={remaining}
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
