import { useCallback, useEffect, useState, useRef } from 'react';

import { defaultHeader } from '@/shared/constants/subtitles';
import { formatAssSubtitles } from '@/shared/utils/subtitles';

import JASSUB from 'public/vendor/jassub/jassub.es.js';
import log from 'electron-log';
import usePlayerStore from '@stores/player';

const useSubtitles = (
  videoRef: React.RefObject<HTMLVideoElement>,
  isVideoReady: boolean
) => {
  const [subtitlesRenderer, setSubtitlesRenderer] = useState<JASSUB | null>(
    null
  );

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
    setLastSegmentCount
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
        prescaleFactor: 0.8
      });

      log.info('Subtitles renderer initialized');

      setSubtitlesRenderer(renderer);
    }
  }, [videoRef, subtitlesRenderer, isVideoReady]);

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

  useEffect(() => {
    const handleSubtitles = (
      _: any,
      result: { success: boolean; data: any[] }
    ) => {
      const subtitlesArray = Object.values(result.data);
      
      if (result.success && subtitlesArray.length > 0) {
        // Parse all subtitles and store them
        const parsedSubtitles = subtitlesArray.map(subtitle => ({
          ...subtitle,
          parsedContent: formatAssSubtitles(subtitle)
        }));
        
        setAvailableSubtitles(parsedSubtitles);

        // Find Spanish/Latin America subtitle
        const defaultSubtitle = parsedSubtitles.find(
          sub => sub.track.language === 'spa' || 
          (sub.track.name && sub.track.name.includes('Lat'))
        ) || parsedSubtitles[0];

        setSelectedSubtitleTrack(defaultSubtitle);
        setSubtitleContent(defaultSubtitle.parsedContent);
        log.info('Subtitles loaded into renderer');
      }
    };

    const handleError = (_: any, result: { error: string }) => {
      log.error('Subtitle extraction error:', result.error);
    };

    window.api.subtitles.onExtracted.subscribe(handleSubtitles);
    window.api.subtitles.onError.subscribe(handleError);

    return () => {
      window.api.subtitles.onExtracted.unsubscribe(handleSubtitles);
      window.api.subtitles.onError.unsubscribe(handleError);
    };
  }, [loadSubtitles]);

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

  // Listen for SERVER_DONE event to get the actual file path
  useEffect(() => {
    const handleServerDone = (_: any, data: { url: string; filePath: string }) => {
      log.info('Video file path received:', data.filePath);
      setVideoFilePath(data.filePath);
    };

    window.api.torrent.onServerDone.subscribe(handleServerDone);
    return () => window.api.torrent.onServerDone.unsubscribe(handleServerDone);
  }, []);

  const extractSubtitles = useCallback((filePath: string) => {
    log.info('Attempting to extract subtitles from:', filePath);
    
    if (extractionState.status === 'idle' || 
        extractionState.status === 'retrying' || 
        extractionState.status === 'error') {
      const now = Date.now();
      
      setExtractionState(prev => ({
        status: 'extracting',
        attempts: prev.status === 'error' ? 1 : prev.attempts + 1,
        lastAttemptTime: now,
        progress: 0,
        error: null
      }));
      
      try {
        log.info('Calling window.api.subtitles.extractSubtitles');
        window.api.subtitles.extractSubtitles(filePath)
          .then(result => {
            if (result.success) {
              setExtractionState(prev => ({
                ...prev,
                status: 'extracting',
                progress: Math.min((prev.progress || 0) + 33, 99)
              }));
            } else {
              setExtractionState(prev => ({
                ...prev,
                status: 'error',
                error: result.error
              }));
            }
          })
          .catch(error => {
            log.error('Error during extraction:', error);
            setExtractionState(prev => ({
              ...prev,
              status: 'error',
              error: error.message
            }));
          });
      } catch (error) {
        log.error('Failed to call extractSubtitles:', error);
        setExtractionState(prev => ({
          ...prev,
          status: 'error',
          error: error.message
        }));
      }
      
      setSubtitleStatus({ 
        status: 'loading',
        message: `Analizando archivo...`
      });
    } else {
      log.info('Skipping extraction, current state:', extractionState.status);
    }
  }, [extractionState.status]);

  // Start extraction when video is ready AND we have the file path
  useEffect(() => {
    if (isVideoReady && videoFilePath) {
      extractSubtitles(videoFilePath);
    }
  }, [isVideoReady, videoFilePath, extractSubtitles]);

  // Monitor subtitle extraction progress
  useEffect(() => {
    if (!subtitleContent || !duration) return;
    if (extractionState.status === 'completed') return;

    const MAX_ATTEMPTS = 50;
    const RETRY_TIMEOUT = 10000;
    const currentSegments = subtitleRanges.length;

    const checkTimer = setInterval(() => {
      const timeSinceLastAttempt = Date.now() - extractionState.lastAttemptTime;

      if (currentSegments === 0 || timeSinceLastAttempt >= RETRY_TIMEOUT) {
        log.info('Checking retry conditions:', {
          attempts: extractionState.attempts,
          maxAttempts: MAX_ATTEMPTS,
          hasFilePath: !!videoFilePath,
          currentState: extractionState.status,
          timeSinceLastAttempt,
          currentSegments
        });

        if (extractionState.attempts < MAX_ATTEMPTS && videoFilePath) {
          setExtractionState(prev => ({
            ...prev,
            status: 'retrying'
          }));
          
          log.info('Initiating retry for subtitle extraction');
          extractSubtitles(videoFilePath);
        } else {
          log.warn('Max attempts reached or no file path available');
          setExtractionState(prev => ({
            ...prev,
            status: 'error',
            error: 'Max attempts reached'
          }));
        }
      }
    }, RETRY_TIMEOUT);

    return () => clearInterval(checkTimer);
  }, [subtitleContent, duration, extractionState, videoFilePath, extractSubtitles, subtitleRanges]);

  // Separate effect for handling matches
  useEffect(() => {
    if (!subtitleContent || !duration) return;
    if (extractionState.status === 'completed') return;
    if (extractionState.status !== 'extracting') return;

    const currentSegments = subtitleRanges.length;
    const REQUIRED_MATCHES = 3;

    if (currentSegments > 0) {
      const prevSegmentCount = lastSegmentCount ?? 0;

      log.info('Checking segments:', {
        current: currentSegments,
        last: prevSegmentCount,
        consecutive: consecutiveMatches,
        required: REQUIRED_MATCHES
      });

      if (currentSegments === prevSegmentCount) {
        const newConsecutiveMatches = consecutiveMatches + 1;
        
        if (newConsecutiveMatches >= REQUIRED_MATCHES) {
          log.info('Required matches reached, completing extraction');

          setExtractionState({ 
            status: 'completed',
            attempts: extractionState.attempts,
            progress: 100,
            successfulTracks: availableSubtitles.length,
            lastAttemptTime: extractionState.lastAttemptTime
          });
          
          setSubtitleStatus({ 
            status: 'ready',
            message: 'Subtítulos cargados correctamente'
          });

          return;
        }

        setConsecutiveMatches(newConsecutiveMatches);
        setExtractionState(prev => ({
          ...prev,
          progress: Math.min((prev.progress || 0) + (100 / (REQUIRED_MATCHES * 1.5)), 99)
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
      log.error('Subtitle extraction error:', result.error);
      setExtractionState(prev => ({ 
        ...prev, 
        status: 'error',
        error: result.error 
      }));
      setSubtitleStatus({ 
        status: 'error',
        message: 'Error al cargar los subtítulos'
      });
    };

    window.api.subtitles.onError.subscribe(handleError);
    return () => window.api.subtitles.onError.unsubscribe(handleError);
  }, []);

  return {
    loadSubtitles,
    loadSubtitlesFromFile,
  };
};

export default useSubtitles;
