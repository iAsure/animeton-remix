import { useState, useEffect, useCallback } from 'react';
import { defaultHeader } from '../constants/subtitles';

import JASSUB from 'public/vendor/jassub/jassub.es.js';

export const useSubtitles = (
  videoRef: React.RefObject<HTMLVideoElement>,
  isVideoReady: boolean
) => {
  const [subtitlesRenderer, setSubtitlesRenderer] = useState<JASSUB | null>(
    null
  );

  const initializeSubtitlesRenderer = useCallback(() => {
    if (videoRef.current && !subtitlesRenderer && isVideoReady) {
      const renderer = new JASSUB({
        video: videoRef.current,
        subContent: defaultHeader,
        workerUrl: '/vendor/jassub/jassub-worker.js',
        wasmUrl: '/vendor/jassub/jassub-worker.wasm',
        legacyWasmUrl: '/vendor/jassub/jassub-worker.wasm.js',
        modernWasmUrl: '/vendor/jassub/jassub-worker-modern.wasm',
        debug: true,
        asyncRender: true,
        onDemandRender: true
      });

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

  return {
    loadSubtitles,
    loadSubtitlesFromFile,
  };
};
