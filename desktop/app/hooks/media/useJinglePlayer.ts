import { useState, useEffect, useRef, MutableRefObject } from 'react';

interface UseJinglePlayerProps {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  isVideoReady: boolean;
  isLoadingVideo: boolean;
}

const JINGLE_PATH = '/jingle.mp4';

const useJinglePlayer = ({
  videoRef,
  isVideoReady,
  isLoadingVideo,
}: UseJinglePlayerProps) => {
  const [isJinglePlaying, setIsJinglePlaying] = useState(false);
  const [hasJinglePlayed, setHasJinglePlayed] = useState(false);
  const [jingleError, setJingleError] = useState<Error | null>(null);
  const jingleVideoRef = useRef<HTMLVideoElement | null>(null);
  const attemptedToPlay = useRef(false);
  const playbackAttempts = useRef(0);
  const jingleEndedCompletely = useRef(false);

  useEffect(() => {
    if (videoRef.current) {
      const videoSrc = videoRef.current.src;
      return () => {
        if (videoRef.current && videoRef.current.src !== videoSrc) {
          setHasJinglePlayed(false);
          attemptedToPlay.current = false;
          playbackAttempts.current = 0;
          jingleEndedCompletely.current = false;
        }
      };
    }
  }, [videoRef]);

  useEffect(() => {
    if (
      hasJinglePlayed ||
      !isVideoReady ||
      isLoadingVideo ||
      attemptedToPlay.current
    ) {
      return;
    }

    const mainVideo = videoRef.current;
    if (!mainVideo) return;

    if (mainVideo.currentTime > 0.7) {
      setHasJinglePlayed(true);
      return;
    }

    const playJingle = async () => {
      try {
        if (!jingleVideoRef.current && playbackAttempts.current < 3) {
          playbackAttempts.current += 1;
          console.log(
            `Intento ${playbackAttempts.current} de reproducir jingle desde:`,
            JINGLE_PATH
          );

          mainVideo.pause();
          mainVideo.muted = true;

          const jingleVideo = document.createElement('video');

          jingleVideo.onended = () => {
            console.log('Jingle terminado, preparando transición al video principal');
            
            setTimeout(() => {
              jingleEndedCompletely.current = true;
              setIsJinglePlaying(false);
              setHasJinglePlayed(true);
              
              if (jingleVideoRef.current) {
                jingleVideoRef.current.parentNode?.removeChild(
                  jingleVideoRef.current
                );
                jingleVideoRef.current = null;
              }
              
              mainVideo.muted = false;
              
              console.log('Continuando reproducción del video principal');
              mainVideo.play().catch((error) => {
                console.error(
                  'Error reproduciendo video principal después del jingle:',
                  error
                );
              });
            }, 200);
          };

          jingleVideo.onerror = (e) => {
            console.error('Error cargando jingle:', e);
            const error = new Error(
              `Error cargando jingle: ${
                jingleVideo.error?.message || 'Desconocido'
              }`
            );
            setJingleError(error);
            handleJingleError(error);
          };
          
          jingleVideo.style.position = 'absolute';
          jingleVideo.style.top = '0';
          jingleVideo.style.left = '0';
          jingleVideo.style.width = '100%';
          jingleVideo.style.height = '100%';
          jingleVideo.style.objectFit = 'contain';
          jingleVideo.style.backgroundColor = 'black';
          
          jingleVideo.style.opacity = '1';
          jingleVideo.style.filter = 'none';
          jingleVideo.style.transition = 'opacity 0.3s ease';

          jingleVideo.src = JINGLE_PATH;

          const videoContainer = mainVideo.parentNode;
          if (videoContainer) {
            videoContainer.insertBefore(jingleVideo, mainVideo);
            jingleVideoRef.current = jingleVideo;
          }

          setIsJinglePlaying(true);
          attemptedToPlay.current = true;

          console.log('Reproduciendo jingle...');
          await jingleVideo.play();
        }
      } catch (error) {
        console.error('Error playing jingle:', error);
        handleJingleError(error as Error);
      }
    };

    const handleJingleError = (error: Error) => {
      console.error(
        'Error en jingle, reproduciendo video principal directamente:',
        error
      );
      setIsJinglePlaying(false);
      setHasJinglePlayed(true);

      if (jingleVideoRef.current) {
        jingleVideoRef.current.parentNode?.removeChild(jingleVideoRef.current);
        jingleVideoRef.current = null;
      }

      if (mainVideo) {
        mainVideo.muted = false;
        mainVideo.play().catch(console.error);
      }
    };

    playJingle();
  }, [isVideoReady, isLoadingVideo, hasJinglePlayed, videoRef]);

  useEffect(() => {
    if (isJinglePlaying && videoRef.current && !jingleEndedCompletely.current) {
      const mainVideo = videoRef.current;
      
      const keepVideoPaused = () => {
        if (mainVideo && !mainVideo.paused && isJinglePlaying && !jingleEndedCompletely.current) {
          console.log('Manteniendo el video principal pausado durante la reproducción del jingle');
          mainVideo.pause();
        }
      };
      
      const intervalId = setInterval(keepVideoPaused, 100);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isJinglePlaying, videoRef]);

  useEffect(() => {
    return () => {
      if (jingleVideoRef.current) {
        jingleVideoRef.current.parentNode?.removeChild(jingleVideoRef.current);
        jingleVideoRef.current = null;
      }
      attemptedToPlay.current = false;
      playbackAttempts.current = 0;
      jingleEndedCompletely.current = false;
      
      if (videoRef.current) {
        videoRef.current.muted = false;
      }
    };
  }, [videoRef]);

  return {
    isJinglePlaying,
    hasJinglePlayed,
    jingleError,
  };
};

export default useJinglePlayer;
