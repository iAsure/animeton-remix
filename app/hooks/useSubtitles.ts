import { useCallback, useEffect, useState } from 'react';

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
    if (extractionState.status === 'idle' || extractionState.status === 'retrying') {
      const now = Date.now();
      setExtractionState(prev => ({
        status: 'extracting',
        attempts: prev.attempts + 1,
        lastAttemptTime: now,
        progress: 0
      }));
      
      window.api.subtitles.extractSubtitles(filePath);
      
      setSubtitleStatus({ 
        status: 'loading',
        message: `Analizando archivo...`
      });
    }
  }, [extractionState.status, extractionState.attempts]);

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

    const MAX_ATTEMPTS = 15;
    const REQUIRED_MATCHES = 2;
    
    // Calculate current segments count
    const currentSegments = subtitleRanges.length;

    if (currentSegments > 0 && currentSegments === lastSegmentCount) {
      setConsecutiveMatches(prev => prev + 1);
      
      // Update progress more aggressively early on
      setExtractionState(prev => ({
        ...prev,
        progress: Math.min((prev.progress || 0) + (100 / (REQUIRED_MATCHES * 1.5)), 100)
      }));

      // Update status message
      setSubtitleStatus({ 
        status: 'loading',
        message: `Analizando subtítulos... ${Math.round(extractionState.progress || 0)}%`
      });
    } else {
      setConsecutiveMatches(0);
      setLastSegmentCount(currentSegments);

      if (extractionState.attempts < MAX_ATTEMPTS) {
        // Adjust retry delay based on attempt number
        const retryDelay = getRetryDelay(extractionState.attempts);
        
        setExtractionState(prev => ({ 
          ...prev, 
          status: 'retrying',
          progress: Math.max((prev.progress || 0), 20)
        }));

        const timer = setTimeout(() => {
          if (videoFilePath) {
            extractSubtitles(videoFilePath);
          }
        }, retryDelay);

        return () => clearTimeout(timer);
      }
    }

    if (consecutiveMatches >= REQUIRED_MATCHES && currentSegments > 0) {
      setExtractionState(prev => ({ 
        ...prev, 
        status: 'completed',
        progress: 100,
        successfulTracks: availableSubtitles.length
      }));
      
      setSubtitleStatus({ 
        status: 'ready',
        message: 'Subtítulos cargados correctamente'
      });
    }
  }, [subtitleContent, duration, lastSegmentCount, consecutiveMatches, extractionState, subtitleRanges, availableSubtitles]);

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

  const getRetryDelay = (attempt: number): number => {
    if (attempt < 3) return 5000;
    return Math.min(1000 * Math.pow(1.5, attempt - 3), 5000);
  };

  return {
    loadSubtitles,
    loadSubtitlesFromFile,
  };
};

export default useSubtitles;
