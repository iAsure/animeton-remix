import { useCallback, useEffect, useMemo, useState } from 'react';
import useUserActivity from '@hooks/user/useUserActivity';
import useDownloadsStore from '@stores/download';

const useDownloads = () => {
  const { history } = useUserActivity();
  const [resumingTorrents, setResumingTorrents] = useState<
    Record<string, boolean>
  >({});
  const [resumeErrors, setResumeErrors] = useState<Record<string, string>>({});
  const {
    downloads,
    pausedDownloads,
    syncWithActiveTorrents,
    pauseDownload,
    resumeDownload,
    removeDownload,
  } = useDownloadsStore();

  useEffect(() => {
    const initializeDownloads = async () => {
      try {
        const activeTorrents = await window.api.torrent.getActiveTorrents();
        if (activeTorrents && history?.episodes) {
          syncWithActiveTorrents(activeTorrents, history.episodes);
        }
      } catch (error) {
        console.error('Error fetching active torrents:', error);
      }
    };

    initializeDownloads();

    const handleActiveTorrents = (_: any, activeTorrents: any[]) => {
      if (activeTorrents && history?.episodes) {
        syncWithActiveTorrents(activeTorrents, history.episodes);

        if (Object.keys(resumingTorrents).length > 0) {
          const updatedResumingTorrents = { ...resumingTorrents };
          let hasChanges = false;

          const activeInfoHashes = new Set(
            activeTorrents
              .filter((torrent) => torrent && torrent.infoHash)
              .map((torrent) => torrent.infoHash.toLowerCase())
          );

          Object.keys(updatedResumingTorrents).forEach((infoHash) => {
            if (activeInfoHashes.has(infoHash)) {
              delete updatedResumingTorrents[infoHash];
              hasChanges = true;
            }
          });

          if (hasChanges) {
            setResumingTorrents(updatedResumingTorrents);
          }
        }
      }
    };

    window.api.torrent.onActiveTorrents.subscribe(handleActiveTorrents);

    return () => {
      window.api.torrent.onActiveTorrents.unsubscribe(handleActiveTorrents);
    };
  }, [history, syncWithActiveTorrents, resumingTorrents]);

  useEffect(() => {
    if (Object.keys(resumingTorrents).length > 0 && downloads.length > 0) {
      const updatedResumingTorrents = { ...resumingTorrents };
      let hasChanges = false;

      const activeInfoHashes = new Set(
        downloads
          .filter((download) => download && download.torrentHash)
          .map((download) => download.torrentHash.toLowerCase())
      );

      Object.keys(updatedResumingTorrents).forEach((infoHash) => {
        if (activeInfoHashes.has(infoHash)) {
          delete updatedResumingTorrents[infoHash];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setResumingTorrents(updatedResumingTorrents);
      }
    }
  }, [downloads, resumingTorrents]);

  useEffect(() => {
    const pausedInfoHashes = Object.values(pausedDownloads)
      .map((download) => download.torrentHash?.toLowerCase())
      .filter(Boolean) as string[];

    if (
      pausedInfoHashes.length > 0 &&
      Object.keys(resumingTorrents).length > 0
    ) {
      const updatedResumingTorrents = { ...resumingTorrents };
      let hasChanges = false;

      if (hasChanges) {
        setResumingTorrents(updatedResumingTorrents);
      }
    }
  }, [pausedDownloads, resumingTorrents, downloads]);

  useEffect(() => {
    const handleTorrentProgress = (_: any, progress: any) => {
      if (!progress || !progress.infoHash) return;

      const infoHash = progress.infoHash.toLowerCase();

      if (resumingTorrents[infoHash]) {
        const hasSpeed = progress.downloadSpeed > 0 || progress.uploadSpeed > 0;

        if (hasSpeed) {
          setResumingTorrents((prev) => {
            const updated = { ...prev };
            delete updated[infoHash];
            return updated;
          });

          if (resumeErrors[infoHash]) {
            setResumeErrors((prev) => {
              const updated = { ...prev };
              delete updated[infoHash];
              return updated;
            });
          }
        }
      }
    };

    window.api.torrent.onProgress.subscribe(handleTorrentProgress);

    return () => {
      window.api.torrent.onProgress.unsubscribe(handleTorrentProgress);
    };
  }, [resumingTorrents, resumeErrors]);

  useEffect(() => {
    const handleTorrentError = (_: any, error: { error: string }) => {
      if (Object.keys(resumingTorrents).length > 0) {
        const updatedErrors = { ...resumeErrors };
        let hasChanges = false;

        Object.keys(resumingTorrents).forEach((infoHash) => {
          updatedErrors[infoHash] =
            error.error || 'Error al reanudar el torrent';
          hasChanges = true;
        });

        if (hasChanges) {
          setResumeErrors(updatedErrors);
        }
      }
    };

    window.api.torrent.onError.subscribe(handleTorrentError);

    return () => {
      window.api.torrent.onError.unsubscribe(handleTorrentError);
    };
  }, [resumingTorrents, resumeErrors]);

  const handlePauseResume = useCallback(
    async (infoHash: string, torrentUrl: string) => {
      if (!infoHash || !torrentUrl) {
        console.error('Missing infoHash or torrentUrl for pause/resume');
        return { isPaused: false, error: 'Faltan datos para pausar/reanudar' };
      }

      try {
        const allDownloads = [...downloads, ...Object.values(pausedDownloads)];
        const currentDownload = allDownloads.find(
          (d) =>
            d.torrentHash &&
            d.torrentHash.toLowerCase() === infoHash.toLowerCase()
        );

        if (!currentDownload) {
          console.error(`No se puede encontrar la descarga para ${infoHash}`);
          return { isPaused: false, error: 'Descarga no encontrada' };
        }

        const normalizedInfoHash = infoHash.toLowerCase();
        const isPaused =
          currentDownload.status === 'paused' ||
          currentDownload.progress?.isPaused;

        if (resumeErrors[normalizedInfoHash]) {
          setResumeErrors((prev) => {
            const updated = { ...prev };
            delete updated[normalizedInfoHash];
            return updated;
          });
        }

        if (isPaused) {
          setResumingTorrents((prev) => ({
            ...prev,
            [normalizedInfoHash]: true,
          }));
        }

        const response = await window.api.torrent.pause({
          infoHash,
          torrentUrl,
        });

        if (response.isPaused) {
          pauseDownload(currentDownload);

          setResumingTorrents((prev) => {
            const updated = { ...prev };
            delete updated[normalizedInfoHash];
            return updated;
          });
        } else {
          resumeDownload(currentDownload);

          if (!isPaused) {
            setResumingTorrents((prev) => {
              const updated = { ...prev };
              delete updated[normalizedInfoHash];
              return updated;
            });
          }

          setTimeout(() => {
            setResumingTorrents((prev) => {
              if (prev[normalizedInfoHash]) {
                setResumeErrors((errPrev) => ({
                  ...errPrev,
                  [normalizedInfoHash]: 'Tiempo de espera agotado al reanudar',
                }));

                const updated = { ...prev };
                delete updated[normalizedInfoHash];
                return updated;
              }
              return prev;
            });
          }, 20000);
        }

        return response;
      } catch (error) {
        console.error('Error al pausar/reanudar torrent:', error);

        const normalizedInfoHash = infoHash.toLowerCase();

        setResumeErrors((prev) => ({
          ...prev,
          [normalizedInfoHash]:
            error instanceof Error ? error.message : 'Error desconocido',
        }));

        setResumingTorrents((prev) => {
          const updated = { ...prev };
          delete updated[normalizedInfoHash];
          return updated;
        });

        return {
          isPaused: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
        };
      }
    },
    [downloads, pausedDownloads, pauseDownload, resumeDownload, resumeErrors]
  );

  const cancelResume = useCallback((infoHash: string) => {
    if (!infoHash) return;

    const normalizedInfoHash = infoHash.toLowerCase();

    setResumingTorrents((prev) => {
      const updated = { ...prev };
      delete updated[normalizedInfoHash];
      return updated;
    });

    setResumeErrors((prev) => {
      const updated = { ...prev };
      delete updated[normalizedInfoHash];
      return updated;
    });
  }, []);

  const visualDownloads = useMemo(() => {
    const pausedDownloadsList = Object.values(pausedDownloads);
    const activeDownloadsMap = new Map(downloads.map((d) => [d.episodeId, d]));

    const result = [...downloads];

    pausedDownloadsList.forEach((pausedDownload) => {
      if (!activeDownloadsMap.has(pausedDownload.episodeId)) {
        result.push(pausedDownload);
      }
    });

    return result;
  }, [downloads, pausedDownloads]);

  return {
    downloads,
    visualDownloads,
    hasActiveDownloads: downloads.length > 0,
    hasVisualDownloads: visualDownloads.length > 0,
    removeDownload,
    pauseResume: handlePauseResume,
    cancelResume,
    isResumingTorrent: useCallback(
      (infoHash: string) => {
        if (!infoHash) return false;
        return !!resumingTorrents[infoHash.toLowerCase()];
      },
      [resumingTorrents]
    ),
    getResumeError: useCallback(
      (infoHash: string) => {
        if (!infoHash) return null;
        return resumeErrors[infoHash.toLowerCase()] || null;
      },
      [resumeErrors]
    ),
    getDownloadByEpisodeId: useCallback(
      (episodeId: string) => {
        if (!episodeId) return undefined;

        const activeDownload = downloads.find((d) => d.episodeId === episodeId);
        if (activeDownload) return activeDownload;

        return pausedDownloads[episodeId];
      },
      [downloads, pausedDownloads]
    ),
  };
};

export default useDownloads;
