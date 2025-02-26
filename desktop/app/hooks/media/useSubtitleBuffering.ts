import { useState, useEffect, useCallback } from 'react';
import usePlayerStore from '@stores/player';

interface UseSubtitleBufferingOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  isVideoReady: boolean;
  setIsLocalBuffering: (isBuffering: boolean) => void;
}

const useSubtitleBuffering = ({
  videoRef,
  isVideoReady,
  setIsLocalBuffering,
}: UseSubtitleBufferingOptions) => {
  const [isWaitingForSubtitles, setIsWaitingForSubtitles] = useState(false);

  const {
    currentTime,
    duration,
    subtitleRanges,
    subtitleContent,
    availableSubtitles,
    extractionState,
  } = usePlayerStore();

  const hasSubtitlesAhead = useCallback(() => {
    if (!subtitleRanges.length || !videoRef.current) return false;

    const currentPosition = videoRef.current.currentTime;
    const videoProgress = currentPosition / duration;

    if (videoProgress > 0.7) return true;

    return subtitleRanges.some((range) => range.start > currentPosition);
  }, [subtitleRanges, duration, videoRef]);

  const hasSubtitlesAvailable = useCallback(() => {
    const hasApiSubtitles = availableSubtitles.some(
      (sub) => sub.source === 'api' && sub.parsedContent
    );

    const hasExtractedSubtitles = availableSubtitles.some(
      (sub) => sub.source === 'extractor' && sub.parsedContent
    );

    const hasContent = !!subtitleContent && subtitleContent.length > 0;

    return hasApiSubtitles || hasExtractedSubtitles || hasContent;
  }, [availableSubtitles, subtitleContent]);

  const isSubtitleExtractionPending = useCallback(() => {
    return (
      extractionState.status === 'extracting' ||
      extractionState.status === 'retrying'
    );
  }, [extractionState.status]);

  const checkSubtitleBuffering = useCallback(() => {
    if (!isVideoReady || !videoRef.current) return;

    if (!hasSubtitlesAvailable() && isSubtitleExtractionPending()) {
      if (!isWaitingForSubtitles) {
        console.info('Waiting for subtitles to be extracted');
        setIsWaitingForSubtitles(true);
        setIsLocalBuffering(true);

        if (!videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
      return;
    }

    if (hasSubtitlesAvailable()) {
      const shouldBuffer = !hasSubtitlesAhead();

      if (shouldBuffer && !isWaitingForSubtitles) {
        console.info('Waiting for subtitles ahead before playing');
        setIsWaitingForSubtitles(true);
        setIsLocalBuffering(true);

        if (!videoRef.current.paused) {
          videoRef.current.pause();
        }
      } else if (!shouldBuffer && isWaitingForSubtitles) {
        console.info('Subtitles ahead found, resuming playback');
        setIsWaitingForSubtitles(false);
        setIsLocalBuffering(false);

        if (videoRef.current.paused) {
          videoRef.current.play().catch((error) => {
            console.error(
              'Error resuming video after subtitle buffering',
              error
            );
          });
        }
      }
    } else if (
      extractionState.status === 'error' ||
      extractionState.status === 'completed'
    ) {
      if (isWaitingForSubtitles) {
        console.info('No subtitles available, allowing playback anyway');
        setIsWaitingForSubtitles(false);
        setIsLocalBuffering(false);

        if (videoRef.current.paused) {
          videoRef.current.play().catch((error) => {
            console.error('Error resuming video without subtitles', error);
          });
        }
      }
    }
  }, [
    isVideoReady,
    hasSubtitlesAhead,
    hasSubtitlesAvailable,
    isSubtitleExtractionPending,
    isWaitingForSubtitles,
    setIsLocalBuffering,
    videoRef,
    extractionState.status,
  ]);

  useEffect(() => {
    checkSubtitleBuffering();
  }, [currentTime, subtitleRanges, checkSubtitleBuffering]);

  useEffect(() => {
    checkSubtitleBuffering();
  }, [
    extractionState.status,
    availableSubtitles,
    subtitleContent,
    checkSubtitleBuffering,
  ]);

  useEffect(() => {
    if (!isVideoReady) return;

    const intervalId = setInterval(() => {
      checkSubtitleBuffering();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isVideoReady, checkSubtitleBuffering]);

  useEffect(() => {
    if (!videoRef.current || !isVideoReady) return;

    const handleTimeUpdate = () => {
      checkSubtitleBuffering();
    };

    videoRef.current.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef, isVideoReady, checkSubtitleBuffering]);

  return {
    isWaitingForSubtitles,
  };
};

export default useSubtitleBuffering;
