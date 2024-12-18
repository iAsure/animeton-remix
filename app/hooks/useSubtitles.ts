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
  const { setAvailableSubtitles, setSelectedSubtitleTrack, subtitleContent, setSubtitleContent } = usePlayerStore();

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

  return {
    loadSubtitles,
    loadSubtitlesFromFile,
  };
};

export default useSubtitles;
