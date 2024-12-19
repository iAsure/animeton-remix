import { useCallback, useEffect, useState } from 'react';

import { defaultHeader } from '@/shared/constants/subtitles';
import { formatAssSubtitles } from '@/shared/utils/subtitles';

import JASSUB from 'public/vendor/jassub/jassub.es.js';
import log from 'electron-log';
import usePlayerStore from '@stores/player';

interface ExtractionState {
  status: 'idle' | 'extracting' | 'retrying' | 'completed' | 'error';
  error?: string;
  attempts: number;
}

const useSubtitles = (
  videoRef: React.RefObject<HTMLVideoElement>,
  isVideoReady: boolean
) => {
  const [subtitlesRenderer, setSubtitlesRenderer] = useState<JASSUB | null>(
    null
  );
  const [lastSubContent, setLastSubContent] = useState<string | null>(null);
  const [consecutiveMatches, setConsecutiveMatches] = useState(0);
  const [videoFilePath, setVideoFilePath] = useState<string | null>(null);
  const [extractionState, setExtractionState] = useState<ExtractionState>({
    status: 'idle',
    attempts: 0
  });

  const {
    duration,
    subtitleContent,
    setAvailableSubtitles,
    setSelectedSubtitleTrack,
    setSubtitleContent,
    updateSubtitleRanges,
    setSubtitleStatus
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
      setExtractionState(prev => ({
        status: 'extracting',
        attempts: prev.attempts + 1
      }));
      
      window.api.subtitles.extractSubtitles(filePath);
      log.info('Starting subtitle extraction, attempt:', extractionState.attempts + 1);
      
      setSubtitleStatus({ 
        status: 'loading',
        message: `Extrayendo subtítulos (Intento ${extractionState.attempts + 1})`
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

    const MAX_ATTEMPTS = 5;
    const RETRY_DELAY = 10000;

    if (subtitleContent === lastSubContent) {
      setConsecutiveMatches(prev => prev + 1);
    } else {
      setConsecutiveMatches(0);
      setLastSubContent(subtitleContent);

      if (extractionState.attempts < MAX_ATTEMPTS) {
        setExtractionState(prev => ({ ...prev, status: 'retrying' }));
        
        const timer = setTimeout(() => {
          if (videoRef.current?.src) {
            extractSubtitles(videoRef.current.src);
          }
        }, RETRY_DELAY);

        return () => clearTimeout(timer);
      }
    }

    // Update extraction status
    // @ts-ignore
    if (consecutiveMatches >= 2 && extractionState.status !== 'completed') {
      setExtractionState(prev => ({ ...prev, status: 'completed' }));
      log.info('Subtitle extraction completed successfully');
      setSubtitleStatus({ 
        status: 'ready',
        message: 'Subtítulos cargados correctamente'
      });
    } else if (extractionState.attempts >= MAX_ATTEMPTS) {
      setExtractionState(prev => ({ 
        ...prev, 
        status: 'error',
        error: 'Max extraction attempts reached'
      }));
      setSubtitleStatus({ 
        status: 'error',
        message: 'No se pudieron cargar todos los subtítulos'
      });
    }
  }, [subtitleContent, duration, lastSubContent, consecutiveMatches, extractionState.attempts]);

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
