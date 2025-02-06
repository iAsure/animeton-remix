import { useCallback, useEffect, useState, useRef } from 'react';

import { defaultHeader } from '@/shared/constants/subtitles';
import { formatAssSubtitles } from '@/shared/utils/subtitles';

import JASSUB from 'public/vendor/jassub/jassub.es.js';
import usePlayerStore from '@stores/player';

const useSubtitles = (
  videoRef: React.RefObject<HTMLVideoElement>,
  isVideoReady: boolean
) => {
  const [subtitlesRenderer, setSubtitlesRenderer] = useState<JASSUB | null>(
    null
  );
  const [infoHash, setInfoHash] = useState<string | null>(null);

  const {
    duration,
    subtitleContent,
    availableSubtitles,
    subtitleRanges,
    setAvailableSubtitles,
    setSelectedSubtitleTrack,
    setSubtitleContent,
    updateSubtitleRanges,
    setSubtitleStatus,
    consecutiveMatches,
    videoFilePath,
    extractionState,
    lastSegmentCount,
    setConsecutiveMatches,
    setVideoFilePath,
    setExtractionState,
    setLastSegmentCount,
    selectedSubtitleTrack,
  } = usePlayerStore();

  const initializeSubtitlesRenderer = useCallback(() => {
    if (videoRef.current && !subtitlesRenderer && isVideoReady) {
      const renderer = new JASSUB({
        video: videoRef.current,
        subContent: defaultHeader,
        workerUrl: '/vendor/jassub/jassub-worker.js',
        wasmUrl: '/vendor/jassub/jassub-worker.wasm',
        legacyWasmUrl: '/vendor/jassub/jassub-worker.wasm.js',
        modernWasmUrl: '/vendor/jassub/jassub-worker-modern.wasm',
        debug: false,
        asyncRender: true,
        onDemandRender: true,
        prescaleFactor: 0.8,
      });

      console.info('Subtitles renderer initialized');

      setSubtitlesRenderer(renderer);
    }
  }, [videoRef, subtitlesRenderer, isVideoReady]);

  useEffect(() => {
    if (!selectedSubtitleTrack) {
      loadSubtitles(defaultHeader);
    }
  }, [selectedSubtitleTrack]);

  useEffect(() => {
    if (isVideoReady) {
      initializeSubtitlesRenderer();
    }

    return () => {
      if (subtitlesRenderer) {
        subtitlesRenderer.destroy('');
      }
    };
  }, [initializeSubtitlesRenderer, subtitlesRenderer, isVideoReady]);

  const loadSubtitles = useCallback(
    (subtitleContent: string) => {
      if (subtitlesRenderer) {
        subtitlesRenderer.setTrack(subtitleContent);
      }
    },
    [subtitlesRenderer]
  );

  const loadSubtitlesFromFile = useCallback(
    async (file: File) => {
      const content = await file.text();
      loadSubtitles(content);
    },
    [loadSubtitles]
  );

  const loadApiSubtitles = useCallback(
    (subtitleContent: string) => {
      const apiSubtitle = {
        track: {
          language: 'spa',
          name: 'Español Latino',
          default: true,
          isApiTrack: true,
        },
        parsedContent: subtitleContent,
        source: 'api',
      };

      setAvailableSubtitles([apiSubtitle]);
      setSelectedSubtitleTrack(apiSubtitle);
      setSubtitleContent(subtitleContent);
    },
    [availableSubtitles]
  );

  const handleSubtitles = (
    _: any,
    result: { success: boolean; data: any[] }
  ) => {
    const subtitlesArray = Object.values(result.data);

    if (!result.success || subtitlesArray.length === 0) return;

    const baseSubtitles = subtitlesArray.filter(
      (sub) =>
        sub.track.language === 'spa' ||
        sub.track.language === 'eng' ||
        sub.track.name === 'English'
    );

    const parsedSubtitles = baseSubtitles.map((subtitle) => {
      const updatedSubtitle = { ...subtitle };
      
      if (subtitle.track.name === 'English') {
        updatedSubtitle.track.name = 'Ingles';
      } else if (subtitle.track.language === 'spa' && !subtitle.track.name?.includes('Lat')) {
        updatedSubtitle.track.name = 'Español España';
      } else if (subtitle.track.language === 'spa' && subtitle.track.name?.includes('Lat')) {
        updatedSubtitle.track.name = 'Español Latino';
      }
      
      return {
        ...updatedSubtitle,
        parsedContent: formatAssSubtitles(updatedSubtitle),
        source: 'extractor',
      };
    }).sort((a, b) => {
      if (a.track.name === 'Ingles') return 1;
      if (b.track.name === 'Ingles') return -1;
      return 0;
    });

    const currentSubtitles = usePlayerStore.getState().availableSubtitles;
    const currentSelectedSubtitleTrack =
      usePlayerStore.getState().selectedSubtitleTrack;
    const currentApiSub = currentSubtitles.find((sub) => sub.source === 'api');

    let newSubtitles;
    if (currentApiSub) {
      const latIndex = parsedSubtitles.findIndex(
        sub => sub.track.name && sub.track.name.includes('Lat')
      );
      
      if (latIndex !== -1) {
        newSubtitles = [...parsedSubtitles];
        newSubtitles[latIndex] = currentApiSub;
      } else {
        newSubtitles = [currentApiSub, ...parsedSubtitles];
      }
    } else {
      newSubtitles = parsedSubtitles;
    }

    setAvailableSubtitles(newSubtitles);
    
    const currentSubtitleContent = newSubtitles.find((sub) => sub.track.name === currentSelectedSubtitleTrack?.track.name)?.parsedContent;
    setSubtitleContent(currentSubtitleContent);

    if (!currentSelectedSubtitleTrack) {
      const defaultLatSubtitle =
        parsedSubtitles.find(
          (sub) => sub.track.name && sub.track.name.includes('Lat')
        ) || parsedSubtitles[0];

      if (defaultLatSubtitle) {
        setSelectedSubtitleTrack(defaultLatSubtitle);
        setSubtitleContent(defaultLatSubtitle.parsedContent);
      }
    }
  };

  useEffect(() => {
    const handleError = (_: any, result: { error: string }) => {
      console.error('Subtitle extraction error:', result.error);
    };

    window.api.subtitles.onExtracted.subscribe(handleSubtitles);
    window.api.subtitles.onError.subscribe(handleError);

    return () => {
      window.api.subtitles.onExtracted.unsubscribe(handleSubtitles);
      window.api.subtitles.onError.unsubscribe(handleError);
    };
  }, []);

  useEffect(() => {
    if (subtitleContent !== null && subtitlesRenderer) {
      subtitlesRenderer.setTrack(subtitleContent);
    }
  }, [subtitleContent, subtitlesRenderer]);

  useEffect(() => {
    if (subtitleContent) {
      updateSubtitleRanges();
    }
  }, [subtitleContent, duration]);

  useEffect(() => {
    const handleServerDone = (
      _: any,
      data: { url: string; filePath: string; infoHash: string }
    ) => {
      console.info('Video file path received:', data.filePath);
      setVideoFilePath(data.filePath);
      setInfoHash(data.infoHash);
    };

    window.api.torrent.onServerDone.subscribe(handleServerDone);
    return () => window.api.torrent.onServerDone.unsubscribe(handleServerDone);
  }, []);

  const extractSubtitles = useCallback(
    (filePath: string) => {
      console.info('Attempting to extract subtitles from:', filePath);

      if (
        extractionState.status === 'idle' ||
        extractionState.status === 'retrying' ||
        extractionState.status === 'error'
      ) {
        const now = Date.now();

        setExtractionState((prev) => ({
          status: 'extracting',
          attempts: prev.status === 'error' ? 1 : prev.attempts + 1,
          lastAttemptTime: now,
          progress: 0,
          error: null,
        }));

        try {
          console.info('Calling window.api.subtitles.extractSubtitles');
          window.api.subtitles
            .extractSubtitles(filePath)
            .then((result) => {
              if (result.success) {
                setExtractionState((prev) => ({
                  ...prev,
                  status: 'extracting',
                  progress: Math.min((prev.progress || 0) + 33, 99),
                }));
              } else {
                setExtractionState((prev) => ({
                  ...prev,
                  status: 'error',
                  error: result.error,
                }));
              }
            })
            .catch((error) => {
              console.error('Error during extraction:', error);
              setExtractionState((prev) => ({
                ...prev,
                status: 'error',
                error: error.message,
              }));
            });
        } catch (error) {
          console.error('Failed to call extractSubtitles:', error);
          setExtractionState((prev) => ({
            ...prev,
            status: 'error',
            error: error.message,
          }));
        }

        setSubtitleStatus({
          status: 'loading',
          message: `Analizando archivo...`,
        });
      } else {
        console.info('Skipping extraction, current state:', extractionState.status);
      }
    },
    [extractionState.status]
  );

  useEffect(() => {
    if (isVideoReady && videoFilePath) {
      extractSubtitles(videoFilePath);
    }
  }, [isVideoReady, videoFilePath, extractSubtitles]);

  // Monitor subtitle extraction progress
  useEffect(() => {
    if (!subtitleContent || !duration) return;
    if (extractionState.status === 'completed') return;

    const MAX_ATTEMPTS = 100;
    const BASE_TIMEOUT = 5000;
    const TIMEOUT_INCREMENT = 500;
    const ATTEMPTS_PER_INCREMENT = 5;

    // Calculate dynamic timeout based on attempts
    const currentRetryTimeout =
      BASE_TIMEOUT +
      Math.floor(extractionState.attempts / ATTEMPTS_PER_INCREMENT) *
        TIMEOUT_INCREMENT;

    const currentSegments = subtitleRanges.length;

    const checkTimer = setInterval(() => {
      const timeSinceLastAttempt = Date.now() - extractionState.lastAttemptTime;

      if (
        currentSegments === 0 ||
        timeSinceLastAttempt >= currentRetryTimeout
      ) {
        console.info('Checking retry conditions:', {
          attempts: extractionState.attempts,
          maxAttempts: MAX_ATTEMPTS,
          currentTimeout: currentRetryTimeout,
          hasFilePath: !!videoFilePath,
          currentState: extractionState.status,
          timeSinceLastAttempt,
          currentSegments,
        });

        if (extractionState.attempts < MAX_ATTEMPTS && videoFilePath) {
          setExtractionState((prev) => ({
            ...prev,
            status: 'retrying',
          }));

          console.info('Initiating retry for subtitle extraction');
          extractSubtitles(videoFilePath);
        } else {
          console.warn('Max attempts reached or no file path available');
          setExtractionState((prev) => ({
            ...prev,
            status: 'error',
            error: 'Max attempts reached',
          }));
        }
      }
    }, currentRetryTimeout);

    return () => clearInterval(checkTimer);
  }, [
    subtitleContent,
    duration,
    extractionState,
    videoFilePath,
    extractSubtitles,
    subtitleRanges,
  ]);

  // Separate effect for handling matches
  useEffect(() => {
    if (!subtitleContent || !duration) return;
    if (extractionState.status === 'completed') return;
    if (extractionState.status !== 'extracting') return;

    const extractedRanges = usePlayerStore.getState().getExtractedSubtitleRanges();
    const currentSegments = extractedRanges.length;
    const REQUIRED_MATCHES = 30;

    if (currentSegments > 0) {
      const prevSegmentCount = lastSegmentCount ?? 0;

      console.info('Checking segments:', {
        current: currentSegments,
        last: prevSegmentCount,
        consecutive: consecutiveMatches,
        required: REQUIRED_MATCHES,
      });

      if (currentSegments === prevSegmentCount) {
        const newConsecutiveMatches = consecutiveMatches + 1;

        if (newConsecutiveMatches >= REQUIRED_MATCHES) {
          console.info('Required matches reached, completing extraction');

          setExtractionState({
            status: 'completed',
            attempts: extractionState.attempts,
            progress: 100,
            lastAttemptTime: extractionState.lastAttemptTime,
          });

          setSubtitleStatus({
            status: 'ready',
            message: 'Subtítulos cargados correctamente',
          });

          return;
        }

        setConsecutiveMatches(newConsecutiveMatches);
        setExtractionState((prev) => ({
          ...prev,
          progress: Math.min(
            (prev.progress || 0) + 100 / (REQUIRED_MATCHES * 1.5),
            99
          ),
        }));
      } else {
        setLastSegmentCount(currentSegments);
        setConsecutiveMatches(0);
      }
    }
  }, [subtitleContent, extractionState.status === 'extracting']);

  // Handle extraction errors
  useEffect(() => {
    const handleError = (_: any, result: { error: string }) => {
      console.error('Subtitle extraction error:', result.error);
      setExtractionState((prev) => ({
        ...prev,
        status: 'error',
        error: result.error,
      }));
      setSubtitleStatus({
        status: 'error',
        message: 'Error al cargar los subtítulos',
      });
    };

    window.api.subtitles.onError.subscribe(handleError);
    return () => window.api.subtitles.onError.unsubscribe(handleError);
  }, []);

  return {
    loadSubtitles,
    loadSubtitlesFromFile,
    loadApiSubtitles,
    infoHash,
  };
};

export default useSubtitles;
